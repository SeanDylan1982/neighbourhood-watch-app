const Notice = require('../models/Notice');
const Report = require('../models/Report');
const Message = require('../models/Message');
const AuditService = require('./AuditService');

/**
 * Service for handling flagged content moderation functionality
 * Focuses specifically on content that has been reported/flagged by users
 */
class FlaggedContentService {
  /**
   * Get flagged content with optimized database queries
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number (default: 1)
   * @param {number} params.limit - Items per page (default: 20)
   * @param {string} params.contentType - Filter by content type (notice, report, message, all)
   * @param {string} params.sortBy - Sort field (flaggedAt, reportCount, createdAt)
   * @param {string} params.sortOrder - Sort order (asc, desc)
   * @returns {Promise<Object>} Paginated flagged content with report details
   */
  static async getFlaggedContent(params = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        contentType = 'all',
        sortBy = 'flaggedAt',
        sortOrder = 'desc'
      } = params;

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const sortDirection = sortOrder === 'asc' ? 1 : -1;

      // Build aggregation pipeline for optimized queries
      const buildAggregationPipeline = (Model, type) => {
        const pipeline = [
          // Match only flagged content
          {
            $match: type === 'message' ? {
              isReported: true,
              'reportedBy.0': { $exists: true } // Ensure reportedBy array is not empty
            } : {
              isFlagged: true,
              'reports.0': { $exists: true } // Ensure reports array is not empty
            }
          },
          // Add computed fields
          {
            $addFields: {
              contentType: type,
              reportCount: type === 'message' ? { $size: '$reportedBy' } : { $size: '$reports' }
            }
          },
          // Populate author/reporter information
          {
            $lookup: {
              from: 'users',
              localField: type === 'notice' ? 'authorId' : 
                         type === 'report' ? 'reporterId' : 'senderId',
              foreignField: '_id',
              as: 'author',
              pipeline: [
                { $project: { firstName: 1, lastName: 1, email: 1 } }
              ]
            }
          },
          // Populate report authors
          {
            $lookup: {
              from: 'users',
              localField: type === 'message' ? 'reportedBy.userId' : 'reports.reporterId',
              foreignField: '_id',
              as: 'reportAuthors',
              pipeline: [
                { $project: { firstName: 1, lastName: 1, email: 1 } }
              ]
            }
          },
          // Flatten author array
          {
            $addFields: {
              author: { $arrayElemAt: ['$author', 0] }
            }
          },
          // Sort
          {
            $sort: {
              [sortBy === 'reportCount' ? 'reportCount' : sortBy]: sortDirection
            }
          }
        ];

        return pipeline;
      };

      let results = { total: 0, content: [], page: parseInt(page), limit: parseInt(limit), totalPages: 0 };

      // Function to get flagged content from a specific model
      const getFlaggedFromModel = async (Model, type) => {
        const pipeline = buildAggregationPipeline(Model, type);
        
        // Get total count
        const countPipeline = [
          ...pipeline.slice(0, 2), // Only match and addFields stages
          { $count: 'total' }
        ];
        
        const [countResult, content] = await Promise.all([
          Model.aggregate(countPipeline),
          Model.aggregate([
            ...pipeline,
            { $skip: contentType === 'all' ? 0 : skip },
            { $limit: contentType === 'all' ? 1000 : parseInt(limit) }
          ])
        ]);

        const total = countResult[0]?.total || 0;
        
        return {
          total,
          content: content.map(item => ({
            id: item._id,
            contentType: type,
            title: item.title,
            content: item.content || item.description,
            author: item.author,
            reports: type === 'message' ? 
              item.reportedBy.map(report => ({
                id: report._id,
                reason: report.reason,
                reportedBy: item.reportAuthors.find(author => 
                  author._id.toString() === report.userId?.toString()
                ) || { firstName: 'Anonymous', lastName: '', email: '' },
                reportedAt: report.reportedAt,
                isAnonymous: !report.userId
              })) :
              item.reports.map(report => ({
                id: report._id,
                reason: report.reason,
                reportedBy: item.reportAuthors.find(author => 
                  author._id.toString() === report.reporterId?.toString()
                ) || { firstName: 'Anonymous', lastName: '', email: '' },
                reportedAt: report.reportedAt,
                isAnonymous: !report.reporterId
              })),
            reportCount: item.reportCount,
            createdAt: item.createdAt,
            flaggedAt: item.flaggedAt,
            status: item.status || item.reportStatus || item.moderationStatus || 'active'
          }))
        };
      };

      // Get content based on type filter
      if (contentType === 'all' || contentType === 'notice') {
        const noticeResults = await getFlaggedFromModel(Notice, 'notice');
        results.total += noticeResults.total;
        results.content = [...results.content, ...noticeResults.content];
      }

      if (contentType === 'all' || contentType === 'report') {
        const reportResults = await getFlaggedFromModel(Report, 'report');
        results.total += reportResults.total;
        results.content = [...results.content, ...reportResults.content];
      }

      if (contentType === 'all' || contentType === 'message') {
        const messageResults = await getFlaggedFromModel(Message, 'message');
        results.total += messageResults.total;
        results.content = [...results.content, ...messageResults.content];
      }

      // Sort combined results if getting all content types
      if (contentType === 'all') {
        results.content.sort((a, b) => {
          const aValue = sortBy === 'reportCount' ? a.reportCount : 
                        sortBy === 'flaggedAt' ? new Date(a.flaggedAt) :
                        new Date(a.createdAt);
          const bValue = sortBy === 'reportCount' ? b.reportCount :
                        sortBy === 'flaggedAt' ? new Date(b.flaggedAt) :
                        new Date(b.createdAt);
          
          return sortDirection === 1 ? 
            (aValue > bValue ? 1 : -1) : 
            (aValue < bValue ? 1 : -1);
        });

        // Apply pagination for combined results
        results.content = results.content.slice(skip, skip + parseInt(limit));
      }

      results.totalPages = Math.ceil(results.total / parseInt(limit));

      return results;
    } catch (error) {
      console.error('Error in FlaggedContentService.getFlaggedContent:', error);
      throw new Error('Failed to retrieve flagged content');
    }
  }

  /**
   * Approve content and clear all reports
   * @param {Object} params - Parameters
   * @param {string} params.contentType - Type of content (notice, report, message)
   * @param {string} params.contentId - ID of the content
   * @param {string} params.adminId - ID of the admin performing the action
   * @param {string} params.moderationReason - Optional reason for approval
   * @returns {Promise<Object>} Updated content
   */
  static async approveContent(params) {
    try {
      const { contentType, contentId, adminId, moderationReason } = params;

      // Validate required parameters
      if (!contentType || !contentId || !adminId) {
        throw new Error('Missing required parameters: contentType, contentId, and adminId are required');
      }

      const Model = this._getModelByType(contentType);
      const content = await Model.findById(contentId);
      
      if (!content) {
        throw new Error('Content not found');
      }

      // Check if content is flagged (different field names for different models)
      const isFlagged = contentType === 'message' ? content.isReported : content.isFlagged;
      if (!isFlagged) {
        throw new Error('Content is not flagged');
      }

      // Store original state for audit log
      const originalReportCount = contentType === 'message' ? 
        (content.reportedBy?.length || 0) : 
        (content.reports?.length || 0);

      // Clear all reports and flagged status
      if (contentType === 'message') {
        content.reportedBy = [];
        content.isReported = false;
      } else {
        content.reports = [];
        content.isFlagged = false;
        content.flaggedAt = null;
      }

      // Set status to active based on content type
      this._setContentStatus(content, contentType, 'active');

      // Add moderation metadata
      content.moderationReason = moderationReason || 'Content approved by administrator';
      content.moderatedBy = adminId;
      content.moderatedAt = new Date();

      const updatedContent = await content.save();

      // Log the moderation action
      await this.logModerationAction({
        contentId,
        contentType,
        adminId,
        action: 'approve',
        reason: moderationReason || 'Content approved by administrator',
        details: {
          reportsCleared: originalReportCount,
          previousStatus: 'flagged'
        }
      });

      return updatedContent;
    } catch (error) {
      console.error('Error in FlaggedContentService.approveContent:', error);
      throw error;
    }
  }

  /**
   * Archive content with required reason
   * @param {Object} params - Parameters
   * @param {string} params.contentType - Type of content (notice, report, message)
   * @param {string} params.contentId - ID of the content
   * @param {string} params.adminId - ID of the admin performing the action
   * @param {string} params.moderationReason - Required reason for archiving
   * @returns {Promise<Object>} Updated content
   */
  static async archiveContent(params) {
    try {
      const { contentType, contentId, adminId, moderationReason } = params;

      // Validate required parameters
      if (!contentType || !contentId || !adminId || !moderationReason) {
        throw new Error('Missing required parameters: contentType, contentId, adminId, and moderationReason are required');
      }

      const Model = this._getModelByType(contentType);
      const content = await Model.findById(contentId);
      
      if (!content) {
        throw new Error('Content not found');
      }

      // Store original status for audit log
      const originalStatus = this._getContentStatus(content, contentType);

      // Set status to archived
      this._setContentStatus(content, contentType, 'archived');

      // Add moderation metadata
      content.moderationReason = moderationReason;
      content.moderatedBy = adminId;
      content.moderatedAt = new Date();

      const updatedContent = await content.save();

      // Log the moderation action
      await this.logModerationAction({
        contentId,
        contentType,
        adminId,
        action: 'archive',
        reason: moderationReason,
        details: {
          previousStatus: originalStatus,
          newStatus: 'archived'
        }
      });

      return updatedContent;
    } catch (error) {
      console.error('Error in FlaggedContentService.archiveContent:', error);
      throw error;
    }
  }

  /**
   * Remove content with required reason
   * @param {Object} params - Parameters
   * @param {string} params.contentType - Type of content (notice, report, message)
   * @param {string} params.contentId - ID of the content
   * @param {string} params.adminId - ID of the admin performing the action
   * @param {string} params.moderationReason - Required reason for removal
   * @returns {Promise<Object>} Updated content
   */
  static async removeContent(params) {
    try {
      const { contentType, contentId, adminId, moderationReason } = params;

      // Validate required parameters
      if (!contentType || !contentId || !adminId || !moderationReason) {
        throw new Error('Missing required parameters: contentType, contentId, adminId, and moderationReason are required');
      }

      const Model = this._getModelByType(contentType);
      const content = await Model.findById(contentId);
      
      if (!content) {
        throw new Error('Content not found');
      }

      // Store original status for audit log
      const originalStatus = this._getContentStatus(content, contentType);

      // Set status to removed
      this._setContentStatus(content, contentType, 'removed');

      // Add moderation metadata
      content.moderationReason = moderationReason;
      content.moderatedBy = adminId;
      content.moderatedAt = new Date();

      const updatedContent = await content.save();

      // Log the moderation action
      await this.logModerationAction({
        contentId,
        contentType,
        adminId,
        action: 'remove',
        reason: moderationReason,
        details: {
          previousStatus: originalStatus,
          newStatus: 'removed'
        }
      });

      return updatedContent;
    } catch (error) {
      console.error('Error in FlaggedContentService.removeContent:', error);
      throw error;
    }
  }

  /**
   * Log moderation action for audit trail
   * @param {Object} params - Parameters
   * @param {string} params.contentId - ID of the content
   * @param {string} params.contentType - Type of content
   * @param {string} params.adminId - ID of the admin performing the action
   * @param {string} params.action - Action performed (approve, archive, remove)
   * @param {string} params.reason - Reason for the action
   * @param {Object} params.details - Additional details
   * @returns {Promise<Object>} Audit log entry
   */
  static async logModerationAction(params) {
    const { contentId, contentType, adminId, action, reason, details = {} } = params;

    // Validate required parameters
    if (!contentId || !contentType || !adminId || !action) {
      throw new Error('Missing required parameters for audit logging');
    }

    try {

      const auditData = {
        adminId,
        action: `content_${action}`,
        targetType: contentType,
        targetId: contentId,
        details: {
          reason: reason || 'No reason provided',
          ...details
        }
      };

      return await AuditService.logAction(auditData);
    } catch (error) {
      console.error('Error in FlaggedContentService.logModerationAction:', error);
      // Don't throw - audit logging should not break functionality
      return null;
    }
  }

  /**
   * Get the appropriate model based on content type
   * @private
   * @param {string} contentType - Type of content
   * @returns {Object} Mongoose model
   */
  static _getModelByType(contentType) {
    switch (contentType) {
      case 'notice':
        return Notice;
      case 'report':
        return Report;
      case 'message':
        return Message;
      default:
        throw new Error(`Invalid content type: ${contentType}`);
    }
  }

  /**
   * Get content status based on content type
   * @private
   * @param {Object} content - Content document
   * @param {string} contentType - Type of content
   * @returns {string} Current status
   */
  static _getContentStatus(content, contentType) {
    switch (contentType) {
      case 'message':
        return content.moderationStatus || 'active';
      case 'report':
        return content.reportStatus || 'active';
      default:
        return content.status || 'active';
    }
  }

  /**
   * Set content status based on content type
   * @private
   * @param {Object} content - Content document
   * @param {string} contentType - Type of content
   * @param {string} status - New status
   */
  static _setContentStatus(content, contentType, status) {
    switch (contentType) {
      case 'message':
        content.moderationStatus = status;
        break;
      case 'report':
        content.reportStatus = status;
        break;
      default:
        content.status = status;
        break;
    }
  }
}

module.exports = FlaggedContentService;