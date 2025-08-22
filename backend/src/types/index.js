"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationType = exports.MediaType = exports.UserRole = void 0;
var UserRole;
(function (UserRole) {
    UserRole["USER"] = "user";
    UserRole["MODERATOR"] = "moderator";
    UserRole["ADMIN"] = "admin";
})(UserRole || (exports.UserRole = UserRole = {}));
var MediaType;
(function (MediaType) {
    MediaType["IMAGE"] = "image";
    MediaType["VIDEO"] = "video";
    MediaType["GIF"] = "gif";
})(MediaType || (exports.MediaType = MediaType = {}));
var NotificationType;
(function (NotificationType) {
    NotificationType["LIKE"] = "like";
    NotificationType["COMMENT"] = "comment";
    NotificationType["SHARE"] = "share";
    NotificationType["FOLLOW"] = "follow";
    NotificationType["MENTION"] = "mention";
    NotificationType["MESSAGE"] = "message";
})(NotificationType || (exports.NotificationType = NotificationType = {}));
//# sourceMappingURL=index.js.map