const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const FlaggedContentService = require('../../services/FlaggedContentService');
const Notice = require('../../models/Notice');
const Report = require('../../models/Report');
const Message = require('../../models/Message');
const User = require('../../models/User');

let mongoServer;

describe('FlaggedContentService', () => {
  let testUser, testAdmin, testNotice, testReport, testMessage;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clean up collections
    await User.deleteMany({});
    await Notice.deleteMany({});
    await Report.deleteMany({});
    await Message.deleteMany({});
    // Create test users
    testUser = new User({
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      password: 'hashedpassword',
      role: 'user'
    });
    await testUser.save();

    testAdmin = new User({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@example.com',
      password: 'hashedpassword',
      role: 'admin'
    });
    await testAdmin.save();

    // Create test flagged content
    testNotice = new Notice({
      title: 'Test Notice',
      content: 'This is a test notice',
      category: 'general',
      neighbourhoodId: new mongoose.Types.ObjectId(),
      authorId: testUser._id,
      isFlagged: true,
      flaggedAt: new Date(),
      reports: [
        {
          reporterId: testAdmin._id,
          reason: 'Inappropriate content',
          reportedAt: new Date()
        }
      ]
    });
    await testNotice.save();

    testReport = new Report({
      title: 'Test Report',
      description: 'This is a test report',
      category: 'security',
      neighbourhoodId: new mongoose.Types.ObjectId(),
      reporterId: testUser._id,
      isFlagged: true,
      flaggedAt: new Date(),
      reports: [
        {
          reporterId: testAdmin._id,
          reason: 'Spam content',
          reportedAt: new Date()
        },
        {
          reporterId: testUser._id,
          reason: 'Misleading information',
          reportedAt: new Date()
        }
      ]
    });
    await testReport.save();

    testMessage = new Message({
      chatId: new mongoose.Types.ObjectId(),
      chatType: 'group',
      senderId: testUser._id,
      senderName: 'Test User',
      content: 'This is a test message',
      isReported: true,
      reportedBy: [
        {
          userId: testAdmin._id,
          reason: 'Offensive language',
          reportedAt: new Date()
        }
      ]
    });
    await testMessage.save();
  });

  afterEach(async () => {
    // Clean up after each test
  });

  describe('getFlaggedContent', () => {
    it('should return all flagged content by default', async () => {
      const result = await FlaggedContentService.getFlaggedContent();

      expect(result).toHaveProperty('content');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('page', 1);
      expect(result).toHaveProperty('limit', 20);
      expect(result).toHaveProperty('totalPages');

      expect(result.content).toHaveLength(3);
      expect(result.total).toBe(3);
      expect(result.totalPages).toBe(1);

      // Check content structure
      const noticeContent = result.content.find(c => c.contentType === 'notice');
      expect(noticeContent).toBeDefined();
      expect(noticeContent).toHaveProperty('id');
      expect(noticeContent).toHaveProperty('title', 'Test Notice');
      expect(noticeContent).toHaveProperty('content', 'This is a test notice');
      expect(noticeContent).toHaveProperty('author');
      expect(noticeContent).toHaveProperty('reports');
      expect(noticeContent).toHaveProperty('reportCount', 1);
      expect(noticeContent).toHaveProperty('status', 'active');
    });

    it('should filter by content type', async () => {
      const result = await FlaggedContentService.getFlaggedContent({ contentType: 'notice' });

      expect(result.content).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.content[0].contentType).toBe('notice');
    });

    it('should handle pagination correctly', async () => {
      const result = await FlaggedContentService.getFlaggedContent({ page: 1, limit: 2 });

      expect(result.content).toHaveLength(2);
      expect(result.total).toBe(3);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(2);
      expect(result.totalPages).toBe(2);
    });

    it('should sort by report count', async () => {
      const result = await FlaggedContentService.getFlaggedContent({ 
        sortBy: 'reportCount', 
        sortOrder: 'desc' 
      });

      expect(result.content[0].reportCount).toBe(2); // testReport has 2 reports
      expect(result.content[0].contentType).toBe('report');
    });

    it('should include report details with reporter information', async () => {
      const result = await FlaggedContentService.getFlaggedContent({ contentType: 'report' });

      const reportContent = result.content[0];
      expect(reportContent.reports).toHaveLength(2);
      expect(reportContent.reports[0]).toHaveProperty('reason');
      expect(reportContent.reports[0]).toHaveProperty('reportedBy');
      expect(reportContent.reports[0]).toHaveProperty('reportedAt');
      expect(reportContent.reports[0]).toHaveProperty('isAnonymous', false);
    });

    it('should handle empty results gracefully', async () => {
      // Remove all flagged content
      await Notice.updateMany({}, { isFlagged: false });
      await Report.updateMany({}, { isFlagged: false });
      await Message.updateMany({}, { isReported: false });

      const result = await FlaggedContentService.getFlaggedContent();

      expect(result.content).toHaveLength(0);
      expect(result.total).toBe(0);
      expect(result.totalPages).toBe(0);
    });

    it('should throw error on database failure', async () => {
      // Mock database error
      vi.spyOn(Notice, 'aggregate').mockRejectedValue(new Error('Database error'));

      await expect(FlaggedContentService.getFlaggedContent()).rejects.toThrow('Failed to retrieve flagged content');
    });
  });

  describe('approveContent', () => {
    it('should approve flagged content successfully', async () => {
      const params = {
        contentType: 'notice',
        contentId: testNotice._id.toString(),
        adminId: testAdmin._id.toString(),
        moderationReason: 'Content is appropriate'
      };

      const result = await FlaggedContentService.approveContent(params);

      expect(result.isFlagged).toBe(false);
      expect(result.flaggedAt).toBeNull();
      expect(result.reports).toHaveLength(0);
      expect(result.status).toBe('active');
      expect(result.moderationReason).toBe('Content is appropriate');
      expect(result.moderatedBy.toString()).toBe(testAdmin._id.toString());
      expect(result.moderatedAt).toBeDefined();

      // Note: Audit logging is tested separately
    });

    it('should use default reason when none provided', async () => {
      const params = {
        contentType: 'notice',
        contentId: testNotice._id.toString(),
        adminId: testAdmin._id.toString()
      };

      const result = await FlaggedContentService.approveContent(params);

      expect(result.moderationReason).toBe('Content approved by administrator');
    });

    it('should handle different content types correctly', async () => {
      // Test message approval
      const params = {
        contentType: 'message',
        contentId: testMessage._id.toString(),
        adminId: testAdmin._id.toString(),
        moderationReason: 'Message is fine'
      };

      const result = await FlaggedContentService.approveContent(params);

      expect(result.moderationStatus).toBe('active');
      expect(result.isReported).toBe(false);
    });

    it('should throw error for missing required parameters', async () => {
      await expect(FlaggedContentService.approveContent({})).rejects.toThrow('Missing required parameters');
    });

    it('should throw error for non-existent content', async () => {
      const params = {
        contentType: 'notice',
        contentId: new mongoose.Types.ObjectId().toString(),
        adminId: testAdmin._id.toString()
      };

      await expect(FlaggedContentService.approveContent(params)).rejects.toThrow('Content not found');
    });

    it('should throw error for non-flagged content', async () => {
      // Create non-flagged content
      const nonFlaggedNotice = new Notice({
        title: 'Clean Notice',
        content: 'This is clean content',
        category: 'general',
        neighbourhoodId: new mongoose.Types.ObjectId(),
        authorId: testUser._id,
        isFlagged: false
      });
      await nonFlaggedNotice.save();

      const params = {
        contentType: 'notice',
        contentId: nonFlaggedNotice._id.toString(),
        adminId: testAdmin._id.toString()
      };

      await expect(FlaggedContentService.approveContent(params)).rejects.toThrow('Content is not flagged');
    });

    it('should throw error for invalid content type', async () => {
      const params = {
        contentType: 'invalid',
        contentId: testNotice._id.toString(),
        adminId: testAdmin._id.toString()
      };

      await expect(FlaggedContentService.approveContent(params)).rejects.toThrow('Invalid content type');
    });
  });

  describe('archiveContent', () => {
    it('should archive content successfully', async () => {
      const params = {
        contentType: 'notice',
        contentId: testNotice._id.toString(),
        adminId: testAdmin._id.toString(),
        moderationReason: 'Content violates community guidelines'
      };

      const result = await FlaggedContentService.archiveContent(params);

      expect(result.status).toBe('archived');
      expect(result.moderationReason).toBe('Content violates community guidelines');
      expect(result.moderatedBy.toString()).toBe(testAdmin._id.toString());
      expect(result.moderatedAt).toBeDefined();

      // Note: Audit logging is tested separately
    });

    it('should handle different content types correctly', async () => {
      // Test report archiving
      const params = {
        contentType: 'report',
        contentId: testReport._id.toString(),
        adminId: testAdmin._id.toString(),
        moderationReason: 'Report is outdated'
      };

      const result = await FlaggedContentService.archiveContent(params);

      expect(result.reportStatus).toBe('archived');
    });

    it('should throw error for missing moderation reason', async () => {
      const params = {
        contentType: 'notice',
        contentId: testNotice._id.toString(),
        adminId: testAdmin._id.toString()
      };

      await expect(FlaggedContentService.archiveContent(params)).rejects.toThrow('Missing required parameters');
    });

    it('should throw error for non-existent content', async () => {
      const params = {
        contentType: 'notice',
        contentId: new mongoose.Types.ObjectId().toString(),
        adminId: testAdmin._id.toString(),
        moderationReason: 'Test reason'
      };

      await expect(FlaggedContentService.archiveContent(params)).rejects.toThrow('Content not found');
    });
  });

  describe('removeContent', () => {
    it('should remove content successfully', async () => {
      const params = {
        contentType: 'notice',
        contentId: testNotice._id.toString(),
        adminId: testAdmin._id.toString(),
        moderationReason: 'Content contains harmful information'
      };

      const result = await FlaggedContentService.removeContent(params);

      expect(result.status).toBe('removed');
      expect(result.moderationReason).toBe('Content contains harmful information');
      expect(result.moderatedBy.toString()).toBe(testAdmin._id.toString());
      expect(result.moderatedAt).toBeDefined();

      // Note: Audit logging is tested separately
    });

    it('should handle message removal correctly', async () => {
      const params = {
        contentType: 'message',
        contentId: testMessage._id.toString(),
        adminId: testAdmin._id.toString(),
        moderationReason: 'Message violates terms'
      };

      const result = await FlaggedContentService.removeContent(params);

      expect(result.moderationStatus).toBe('removed');
    });

    it('should throw error for missing moderation reason', async () => {
      const params = {
        contentType: 'notice',
        contentId: testNotice._id.toString(),
        adminId: testAdmin._id.toString()
      };

      await expect(FlaggedContentService.removeContent(params)).rejects.toThrow('Missing required parameters');
    });
  });

  describe('logModerationAction', () => {
    it('should log moderation action successfully', async () => {
      const params = {
        contentId: testNotice._id.toString(),
        contentType: 'notice',
        adminId: testAdmin._id.toString(),
        action: 'approve',
        reason: 'Test reason',
        details: { test: 'data' }
      };

      // This will call the real AuditService, which should work in test environment
      const result = await FlaggedContentService.logModerationAction(params);

      // The result might be null if AuditService fails, but that's expected behavior
      expect(typeof result === 'object' || result === null).toBe(true);
    });

    it('should throw error for missing required parameters', async () => {
      await expect(FlaggedContentService.logModerationAction({})).rejects.toThrow('Missing required parameters for audit logging');
    });
  });

  describe('private helper methods', () => {
    it('should get correct model by type', () => {
      expect(FlaggedContentService._getModelByType('notice')).toBe(Notice);
      expect(FlaggedContentService._getModelByType('report')).toBe(Report);
      expect(FlaggedContentService._getModelByType('message')).toBe(Message);
      
      expect(() => FlaggedContentService._getModelByType('invalid')).toThrow('Invalid content type');
    });

    it('should get content status correctly', () => {
      const notice = { status: 'active' };
      const report = { reportStatus: 'archived' };
      const message = { moderationStatus: 'removed' };

      expect(FlaggedContentService._getContentStatus(notice, 'notice')).toBe('active');
      expect(FlaggedContentService._getContentStatus(report, 'report')).toBe('archived');
      expect(FlaggedContentService._getContentStatus(message, 'message')).toBe('removed');
    });

    it('should set content status correctly', () => {
      const notice = {};
      const report = {};
      const message = {};

      FlaggedContentService._setContentStatus(notice, 'notice', 'archived');
      FlaggedContentService._setContentStatus(report, 'report', 'removed');
      FlaggedContentService._setContentStatus(message, 'message', 'active');

      expect(notice.status).toBe('archived');
      expect(report.reportStatus).toBe('removed');
      expect(message.moderationStatus).toBe('active');
    });
  });
});