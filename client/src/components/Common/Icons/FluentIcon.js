import React from "react";
import { Box } from "@mui/material";
import { Icon } from "@iconify/react";
import * as MuiIcons from "@mui/icons-material";

/**
 * Fluent Icon Component that displays colorful Fluent UI System Color icons with Material UI fallbacks
 *
 * @param {Object} props
 * @param {string} props.name - Name of the icon (e.g., 'Home', 'Settings', 'Add')
 * @param {number} props.size - Size of the icon in pixels (default: 24)
 * @param {string} props.color - Color of the icon (default: 'inherit' - for colorful icons, use 'auto')
 * @param {Object} props.sx - Additional styles for the container
 * @param {Function} props.onClick - Click handler
 */
const FluentIcon = ({
  name,
  size = 24,
  color = "auto", // Default to 'auto' for colorful icons
  sx = {},
  onClick,
  ...props
}) => {
  // Get Fluent Color icon from Iconify
  const getFluentColorIcon = () => {
    // Mapping to Fluent Color icons from @iconify-json/fluent-color
    const fluentColorIconMap = {
      // Navigation and interface
      Home: "fluent-color:home-24",
      Dashboard: "fluent-color:apps-24",
      Settings: "fluent-color:settings-24",
      Person: "fluent-color:person-24",
      People: "fluent-color:people-team-24",
      PersonAdd: "fluent-color:person-add-28",
      PersonRemove: "fluent-color:person-warning-24",
      AdminPanelSettings: "fluent-color:shield-24",

      // Communication
      Chat: "fluent-color:chat-24",
      Message: "fluent-color:mail-24",
      Email: "fluent-color:mail-multiple-24",
      Phone: "fluent-color:phone-24",
      Campaign: "fluent-color:megaphone-loud-24",
      Contacts: "fluent-color:people-list-24",

      // Actions
      Add: "fluent-color:add-circle-24",
      Remove: "fluent-color:dismiss-circle-24",
      Edit: "fluent-color:edit-24",
      Delete: "fluent-color:dismiss-circle-24",
      Close: "fluent-color:dismiss-circle-24",
      Check: "fluent-color:checkmark-circle-24",
      Search: "fluent-color:search-sparkle-24",

      // Navigation arrows
      ArrowBack: "fluent-emoji:left-arrow",
      ArrowForward: "fluent-emoji:right-arrow",
      KeyboardArrowUp: "fluent-emoji:up-arrow",
      KeyboardArrowDown: "fluent-emoji:down-arrow",
      ChevronLeft: "fluent-emoji:fast-reverse-button",
      ChevronRight: "fluent-emoji:fast-forward-button",
      Menu: "fluent-color:diversity-24",

      // Content and status
      Report: "fluent-color:text-bullet-list-square-sparkle-24",
      Reports: "fluent-color:text-bullet-list-square-sparkle-24",
      NoticeBoard: "fluent-color:clipboard-text-edit-24",
      Warning: "fluent-color:warning-24",
      Error: "fluent-color:error-circle-24",
      Info: "fluent-color:question-circle-24",
      Notifications: "fluent-color:alert-24",
      NotificationBell: "fluent-color:alert-badge-24",

      // Admin and system
      Admin: "fluent-color:person-starburst-24",
      SystemStats: "fluent-color:poll-24",
      AuditLog: "fluent-color:history-24",
      Location: "fluent-color:location-ripple-24",
      Profile: "fluent-color:person-24",

      // Security
      Security: "fluent-color:shield-checkmark-24",
      Lock: "fluent-color:lock-closed-24",
      Visibility: "fluent-color:calendar-checkmark-24",
      VisibilityOff: "fluent-color:calendar-cancel-24",

      // Documents and articles
      Article: "fluent-color:document-edit-24",

      // Media
      Image: "fluent-color:image-24",
      VideoFile: "fluent-color:video-24",
      InsertDriveFile: "fluent-color:table-24",
      CloudUpload: "fluent-color:cloud-words-24",

      // Social and engagement
      ThumbUp: "fluent-emoji:thumbs-up",
      Comment: "fluent-color:comment-24",
      Share: "fluent-color:share-android-24",

      // Status and sync
      CloudOff: "fluent-color:cloud-dismiss-24",
      Sync: "fluent-color:arrow-sync-24",
      AccessTime: "fluent-color:clock-24",
      Storage: "fluent-color:database-24",

      // Misc
      MoreVert: "fluent-color:diversity-24",
      LocationOn: "fluent-color:location-ripple-24",
      Palette: "fluent-emoji:artist-palette",

      // Additional icons used throughout the app
      Logout: "fluent-emoji:man-running-facing-right",
      Login: "fluent-emoji:man-raising-hand",
      Upload: "fluent-color:share-ios-24",
      Download: "fluent-color:arrow-square-down-24",
      Refresh: "fluent-color:arrow-sync-24",
      Save: "fluent-emoji:floppy-disk",
      Cancel: "fluent-color:dismiss-circle-24",
      Send: "fluent-color:send-24",
      Reply: "fluent-emoji:right-arrow-curving-left",
      Forward: "fluent-emoji:fast-forward-button",
      Star: "fluent-color:star-24",
      Heart: "fluent-color:heart-24",
      Like: "fluent-emoji:thumbs-up",
      Dislike: "fluent-emoji:thumbs-down",
      Flag: "fluent-color:flag-24",
      Bookmark: "fluent-color:bookmark-24",
      Pin: "fluent-color:pin-24",
      Archive: "fluent-color:vault-24",
      Folder: "fluent-emoji:file-folder",
      FolderOpen: "fluent-emoji:open-file-folder",
      File: "fluent-emoji:card-file-box",
      Copy: "fluent-emoji:bookmark-tabs",
      Cut: "fluent-emoji:scissors",
      Paste: "fluent-color:document-text-24",
      Print: "fluent-emoji:printer",
      QrCode: "fluent-color:search-visual-24",
      Wifi: "fluent-color:wifi-24",
      WifiOff: "fluent-color:wifi-warning-24",
      Battery: "fluent-emoji:low-battery",
      BatteryFull: "fluent-emoji:battery",
      Volume: "fluent-emoji:speaker-high-volume",
      VolumeOff: "fluent-emoji:studio-microphone",
      Mic: "fluent-emoji:studio-microphone",
      MicOff: "fluent-emoji:studio-microphone",
      Camera: "fluent-emoji:camera-with-flash",
      CameraOff: "fluent-emoji:camera",
      Calendar: "fluent-color:calendar-24",
      CalendarAdd: "fluent-color:calendar-edit-24",
      Clock: "fluent-color:clock-alarm-24",
      Timer: "fluent-emoji:timer-clock",
      Alarm: "fluent-emoji:alarm-clock",
      Map: "fluent-emoji:world-map",
      Navigation: "fluent-emoji:round-pushpin",
      Compass: "fluent-emoji:compass",
      Globe: "fluent-emoji:compass",
      Language: "fluent-emoji:input-latin-lowercase",
      Translate: "fluent-emoji:input-latin-lowercase",
      Filter: "fluent-emoji:oil-drum",
      Sort: "fluent-emoji:oil-drum",
      SortAsc: "fluent-emoji:fast-up-button",
      SortDesc: "fluent-emoji:fast-down-button",
      Grid: "fluent-color:apps-list-detail-24",
      List: "fluent-color:apps-list-24",
      ViewModule: "fluent-emoji:television",
      ViewList: "fluent-emoji:video-camera",
      FullScreen: "fluent-color:scan-type-24",
      ExitFullScreen: "fluent-color:scan-person-24",
      ZoomIn: "fluent-emoji:magnifying-glass-tilted-left",
      ZoomOut: "fluent-emoji:magnifying-glass-tilted-right",
      Fit: "fluent-emoji:left-right-arrow",
      Crop: "fluent-emoji:left-right-arrow",
      Rotate: "fluent-emoji:left-right-arrow",
      Flip: "fluent-emoji:right-arrow-curving-up",
      Brightness: "fluent-emoji:bright-button",
      Contrast: "fluent-emoji:white-square-button",
      ColorLens: "fluent-color:design-ideas-24",
      Brush: "fluent-color:paint-brush-24",
      FormatBold: "fluent-emoji:b-button-blood-type",
      FormatItalic: "fluent-emoji:id-button",
      FormatUnderlined: "fluent-emoji:wavy-dash",
      FormatStrikethrough: "fluent-emoji:straight-ruler",
      FormatAlignLeft: "fluent-emoji:reverse-button",
      FormatAlignCenter: "fluent-emoji:upwards-button",
      FormatAlignRight: "fluent-emoji:play-button",
      FormatListBulleted: "fluent-emoji:record-button",
      FormatListNumbered: "fluent-emoji:keycap-1",
      Link: "fluent-color:link-24",
      LinkOff: "fluent-color:link-24",
      AttachFile: "fluent-emoji:paperclip",
      AttachMoney: "fluent-emoji:money-with-wings",
      ShoppingCart: "fluent-emoji:shopping-cart",
      ShoppingBag: "fluent-emoji:shopping-bags",
      CreditCard: "fluent-emoji:credit-card",
      Receipt: "fluent-emoji:receipt",
      LocalOffer: "fluent-color:tag-24",
      Discount: "fluent-emoji:bookmark",
      Percent: "fluent-color:savings-24",
      TrendingUp: "fluent-emoji:chart-increasing",
      TrendingDown: "fluent-emoji:chart-decreasing",
      Analytics: "fluent-color:data-area-24",
      BarChart: "fluent-color:data-bar-vertical-ascending-24",
      PieChart: "fluent-color:data-pie-24",
      Timeline: "fluent-color:data-line-24",
      Speed: "fluent-color:gauge-24",
      Dashboard2: "fluent-color:apps-24",
      Build: "fluent-color:wrench-screwdriver-24",
      Construction: "fluent-color:warning-24",
      Engineering: "fluent-color:arrow-clockwise-dashes-settings-24",
      Science: "fluent-emoji:alembic",
      Psychology: "fluent-emoji:stethoscope",
      School: "fluent-emoji:school",
      MenuBook: "fluent-emoji:orange-book",
      LibraryBooks: "fluent-emoji:books",
      Quiz: "fluent-emoji:nerd-face",
      Assignment: "fluent-emoji:memo",
      Grade: "fluent-emoji:graduation-cap",
      EmojiEvents: "fluent-emoji:stadium",
      EmojiObjects: "fluent-emoji:nut-and-bolt",
      EmojiNature: "fluent-emoji:sunrise-over-mountains",
      EmojiTransportation: "fluent-emoji:trolleybus",
      EmojiFood: "fluent-emoji:sandwich",
      EmojiFlagsOutlined: "fluent-emoji:white-flag",
      EmojiSymbols: "fluent-emoji:input-symbols",
      Pets: "fluent-color:paw-24",
      LocalHospital: "fluent-emoji:hospital",
      LocalPolice: "fluent-emoji:police-officer",
      LocalFireDepartment: "fluent-emoji:fire-engine",
      Emergency: "fluent-emoji:sos-button",
      LocalPharmacy: "fluent-emoji:pill",
      Healing: "fluent-emoji:adhesive-bandage",
      FitnessCenter: "fluent-emoji:tennis",
      SportsEsports: "fluent-emoji:desktop-computer",
      SportsFootball: "fluent-emoji:american-football",
      DirectionsRun: "fluent-emoji:man-running-facing-right",
      DirectionsWalk: "fluent-emoji:man-walking-facing-right",
      DirectionsBike: "fluent-emoji:man-biking",
      DirectionsCar: "fluent-emoji:automobile",
      DirectionsBus: "fluent-emoji:minibus",
      DirectionsSubway: "fluent-emoji:metro",
      Flight: "fluent-emoji:airplane",
      Hotel: "fluent-emoji:hotel",
      Restaurant: "fluent-emoji:convenience-store",
      LocalCafe: "fluent-emoji:teacup-without-handle",
      LocalBar: "fluent-emoji:tropical-drink",
      LocalGroceryStore: "fluent-emoji:beverage-box",
      LocalMall: "fluent-emoji:department-store",
      LocalGasStation: "fluent-emoji:fuel-pump",
      LocalParking: "fluent-emoji:oncoming-automobile",
      LocalAtm: "fluent-emoji:atm-sign",
      LocalLibrary: "fluent-emoji:notebook",
      LocalMovies: "fluent-emoji:film-frames",
      LocalPlay: "fluent-emoji:film-frames",
      Park: "fluent-emoji:camping",
      Beach: "fluent-emoji:beach-with-umbrella",
      Pool: "fluent-emoji:man-playing-water-polo",
      Spa: "fluent-emoji:lotion-bottle",
      Casino: "fluent-emoji:castle",
      NightLife: "fluent-emoji:cityscape-at-dusk",
      Festival: "fluent-emoji:circus-tent",
      TheaterComedy: "fluent-emoji:rolling-on-the-floor-laughing",
      Museum: "fluent-emoji:mosque",
      ChildCare: "fluent-emoji:baby-light",
      Elderly: "fluent-emoji:woman-in-motorized-wheelchair-facing-right",
      Accessible: "fluent-emoji:wheelchair-symbol",
      Wc: "fluent-emoji:restroom",
      Baby: "fluent-emoji:baby",
      FamilyRestroom: "fluent-emoji:restroom",
      Elevator: "fluent-color:elevator-24",
      Stairs: "fluent-emoji:ladder",
      Escalator: "fluent-emoji:roller-coaster",
    };

    return fluentColorIconMap[name] || null;
  };

  // Get Material UI icon as fallback
  const getMaterialIcon = () => {
    // Try direct mapping first
    let MaterialIcon = MuiIcons[name];

    // If not found, try with 'Icon' suffix
    if (!MaterialIcon) {
      MaterialIcon = MuiIcons[`${name}Icon`];
    }

    // Common fallback mappings
    if (!MaterialIcon) {
      const fallbackMap = {
        NotificationBell: MuiIcons.Notifications,
        Campaign: MuiIcons.Campaign,
        Contacts: MuiIcons.Contacts,
        PersonAdd: MuiIcons.PersonAdd,
        PersonRemove: MuiIcons.PersonRemove,
        AdminPanelSettings: MuiIcons.AdminPanelSettings,
        KeyboardArrowUp: MuiIcons.KeyboardArrowUp,
        KeyboardArrowDown: MuiIcons.KeyboardArrowDown,
        ChevronLeft: MuiIcons.ChevronLeft,
        ChevronRight: MuiIcons.ChevronRight,
        ArrowBack: MuiIcons.ArrowBack,
        ArrowForward: MuiIcons.ArrowForward,
        VideoFile: MuiIcons.VideoFile,
        InsertDriveFile: MuiIcons.InsertDriveFile,
        CloudUpload: MuiIcons.CloudUpload,
        MoreVert: MuiIcons.MoreVert,
        LocationOn: MuiIcons.LocationOn,
        AccessTime: MuiIcons.AccessTime,
        CloudOff: MuiIcons.CloudOff,
        Article: MuiIcons.Article,
        Menu: MuiIcons.Menu,
      };

      MaterialIcon = fallbackMap[name];
    }

    return MaterialIcon || MuiIcons.HelpOutline;
  };

  // Try Fluent Color icon first, then fallback to Material UI
  const fluentColorIcon = getFluentColorIcon();

  if (fluentColorIcon) {
    return (
      <Box
        component="span"
        sx={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: size,
          height: size,
          ...sx,
        }}
        onClick={onClick}
        {...props}
      >
        <Icon
          icon={fluentColorIcon}
          width={size}
          height={size}
          style={{
            color: color === "auto" ? undefined : color, // Let colorful icons use their natural colors
          }}
        />
      </Box>
    );
  }

  // Fallback to Material UI icon with better color handling
  const MaterialIcon = getMaterialIcon();
  return (
    <MaterialIcon
      sx={{
        fontSize: size,
        color: color === "auto" ? "primary.main" : color,
        ...sx,
      }}
      onClick={onClick}
      {...props}
    />
  );
};

export default FluentIcon;
