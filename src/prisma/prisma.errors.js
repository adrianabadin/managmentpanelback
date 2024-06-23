"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateManyNotArray = exports.HashCreationError = exports.UnknownPrismaError = exports.returnPrismaError = exports.isPrismaError = exports.isTimeout = exports.TimeoutOrConnectionError = exports.NotFoundError = exports.DuplicateIdentifierConstraintError = exports.duplicateError = exports.notFound = exports.PrismaError = void 0;
var PrismaError = /** @class */ (function (_super) {
    __extends(PrismaError, _super);
    function PrismaError(message, code, errorContent) {
        var _this = _super.call(this, message) || this;
        _this.text = message;
        _this.code = code;
        _this.errorContent = errorContent;
        _this.name = "Prisma Error";
        return _this;
    }
    return PrismaError;
}(Error));
exports.PrismaError = PrismaError;
function notFound(error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2025") {
        return new NotFoundError();
    }
}
exports.notFound = notFound;
function duplicateError(error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
        return new DuplicateIdentifierConstraintError(error);
    }
}
exports.duplicateError = duplicateError;
var DuplicateIdentifierConstraintError = /** @class */ (function (_super) {
    __extends(DuplicateIdentifierConstraintError, _super);
    function DuplicateIdentifierConstraintError(errorContent, message, code) {
        if (message === void 0) { message = "La solicitud viola una limitacion de unicidad en el modelo"; }
        if (code === void 0) { code = "P2002"; }
        var _this = _super.call(this, message, code, errorContent) || this;
        _this.name = "Duplicate Identifier Constraint";
        return _this;
    }
    return DuplicateIdentifierConstraintError;
}(PrismaError));
exports.DuplicateIdentifierConstraintError = DuplicateIdentifierConstraintError;
var NotFoundError = /** @class */ (function (_super) {
    __extends(NotFoundError, _super);
    function NotFoundError(errorContent, message, code) {
        if (message === void 0) { message = "El registro solicitado no existe"; }
        if (code === void 0) { code = "P2025"; }
        var _this = _super.call(this, message, code, errorContent) || this;
        _this.name = "Not Found Error";
        return _this;
    }
    return NotFoundError;
}(PrismaError));
exports.NotFoundError = NotFoundError;
var TimeoutOrConnectionError = /** @class */ (function (_super) {
    __extends(TimeoutOrConnectionError, _super);
    function TimeoutOrConnectionError(errorContent, message, code) {
        if (message === void 0) { message = "Paso el tiempo de conexion o hay demasiadas conexiones a la base de datos"; }
        if (code === void 0) { code = "P2024"; }
        var _this = _super.call(this, message, code, errorContent) || this;
        _this.name = "Timeout Or Connection Error";
        return _this;
    }
    return TimeoutOrConnectionError;
}(PrismaError));
exports.TimeoutOrConnectionError = TimeoutOrConnectionError;
function isTimeout(error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2024") {
        return new TimeoutOrConnectionError(error);
    }
}
exports.isTimeout = isTimeout;
function isPrismaError(error) {
    if (error instanceof PrismaError)
        return error;
}
exports.isPrismaError = isPrismaError;
function returnPrismaError(error) {
    return isTimeout(error) || notFound(error) || duplicateError(error) || isPrismaError(error) || new UnknownPrismaError(error);
}
exports.returnPrismaError = returnPrismaError;
var UnknownPrismaError = /** @class */ (function (_super) {
    __extends(UnknownPrismaError, _super);
    function UnknownPrismaError(errorContent, message, code) {
        if (message === void 0) { message = "Error desconocido de la base de datos"; }
        if (code === void 0) { code = "PX"; }
        var _this = _super.call(this, message, code, errorContent) || this;
        _this.name = "Unknown Prisma Error";
        return _this;
    }
    return UnknownPrismaError;
}(PrismaError));
exports.UnknownPrismaError = UnknownPrismaError;
var HashCreationError = /** @class */ (function (_super) {
    __extends(HashCreationError, _super);
    function HashCreationError(errorContent, message, code) {
        if (message === void 0) { message = "Faltan argumentos para crear el hash"; }
        if (code === void 0) { code = "PHASH"; }
        var _this = _super.call(this, message, code, errorContent) || this;
        _this.name = "Hash Creation Error";
        return _this;
    }
    return HashCreationError;
}(PrismaError));
exports.HashCreationError = HashCreationError;
var CreateManyNotArray = /** @class */ (function (_super) {
    __extends(CreateManyNotArray, _super);
    function CreateManyNotArray(errorContent, message, code) {
        if (message === void 0) { message = "Debes proveer un array de datos"; }
        if (code === void 0) { code = "PNOTARRAY"; }
        var _this = _super.call(this, message, code, errorContent) || this;
        _this.name = "Create Many Not Arrray Error";
        return _this;
    }
    return CreateManyNotArray;
}(PrismaError));
exports.CreateManyNotArray = CreateManyNotArray;
