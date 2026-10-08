"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MakerVelopack = void 0;
const maker_base_1 = __importDefault(require("@electron-forge/maker-base"));
const path_1 = __importDefault(require("path"));
const node_fs_1 = __importDefault(require("node:fs"));
const node_child_process_1 = require("node:child_process");
const default_vpk_program = "vpk";
// --- BEGIN code from electron-winstaller ----------------------
// The following code (up to the END marker below) is from the
// electron-winstaller package and has the following copyright notice:
//
//     Copyright (c) 2015 GitHub Inc.
/**
 * A utility function to convert SemVer version strings into NuGet-compatible
 * version strings.
 * @param version A SemVer version string
 * @returns A NuGet-compatible version string
 * @see {@link https://semver.org/ | Semantic Versioning specification}
 * @see {@link https://learn.microsoft.com/en-us/nuget/concepts/package-versioning?tabs=semver20sort | NuGet versioning specification}
 */
function convertVersion(version) {
    if (version == null)
        return null;
    const parts = version.split('+')[0].split('-');
    const mainVersion = parts.shift();
    if (parts.length > 0) {
        return [mainVersion, parts.join('-').replace(/\./g, '')].join('-');
    }
    else {
        return mainVersion;
    }
}
// --- END of code from electron-winstaller ---------------------
function convertNameToNupkgId(name) {
    if (name == null)
        return null;
    return name.replace(/[^-A-Za-z0-9_.]/g, "_");
}
function assembleCommandLineForDisplay(program, args) {
    const maybe_quoted_args = args.map(arg => arg.match(/\s/) ? '"' + arg + '"' : arg);
    return [program, ...maybe_quoted_args].join(" ");
}
class MakerVelopack extends maker_base_1.default {
    constructor() {
        super(...arguments);
        this.name = 'velopack';
        this.defaultPlatforms = ['win32'];
    }
    isSupportedOnCurrentPlatform() {
        return true;
    }
    checkVpkProgramAvailable() {
        // Note: We cannot do this in `isSupportedOnCurrentPlatform` because this.config is not
        //       yet set when that method is called.
        //
        const vpk_program = this.getVpkProgram();
        const vpk_args = ["--help"];
        const vpk_check_command = assembleCommandLineForDisplay(vpk_program, vpk_args);
        try {
            // we 'ignore' stdout to hide normal output; stderr remains visible to the user
            (0, node_child_process_1.execFileSync)(vpk_program, vpk_args, { stdio: ['inherit', 'ignore', 'inherit'] });
        }
        catch (error) {
            console.error(error);
            throw new Error(`

electron-maker-velopack: The required command line tool '${vpk_program}' does not seem to be available.
(Failed to run command '${vpk_check_command}'.)

You can install 'vpk' by running:

    dotnet tool update -g vpk

This requires a .NET SDK to be installed and the .NET SDK tools to be available in PATH.
(You may need to re-enter the command interpreter session after installing the .NET SDK
to make changes in PATH effective.)

`);
        }
    }
    make(_a) {
        return __awaiter(this, arguments, void 0, function* ({ appName, dir, makeDir, targetPlatform, targetArch, packageJSON, forgeConfig }) {
            var _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q;
            this.checkVpkProgramAvailable();
            let outPath = this.config.outputDir;
            if (outPath == null) {
                outPath = path_1.default.resolve(makeDir, `velopack/${targetPlatform}/${targetArch}`);
                yield this.ensureDirectory(outPath);
            }
            else {
                outPath = path_1.default.resolve(outPath);
            }
            const exe_extension = targetPlatform === "win32" ? ".exe" : "";
            const exe_name = `${forgeConfig.packagerConfig.executableName || appName}${exe_extension}`;
            const exe_path = path_1.default.join(dir, exe_name);
            try {
                yield node_fs_1.default.promises.access(exe_path);
            }
            catch (error) {
                throw new Error(`The executable file to package does not exist at the expected path: ${exe_path}.\n${error}`);
            }
            // we don't check forgeConfig.packagerConfig.appBundleId, as I think that is MacOS-specific
            const pack_id = (_d = (_b = this.config.packId) !== null && _b !== void 0 ? _b : convertNameToNupkgId((_c = forgeConfig.packagerConfig.name) !== null && _c !== void 0 ? _c : null)) !== null && _d !== void 0 ? _d : convertNameToNupkgId(appName);
            const version = (_g = (_e = this.config.packVersion) !== null && _e !== void 0 ? _e : convertVersion((_f = forgeConfig.packagerConfig.appVersion) !== null && _f !== void 0 ? _f : null)) !== null && _g !== void 0 ? _g : convertVersion(packageJSON.version);
            const title = (_k = (_j = (_h = this.config.packTitle) !== null && _h !== void 0 ? _h : (typeof forgeConfig.packagerConfig.name === 'string' ? forgeConfig.packagerConfig.name : null)) !== null && _j !== void 0 ? _j : packageJSON.productName) !== null && _k !== void 0 ? _k : appName;
            const icon = (_l = this.config.icon) !== null && _l !== void 0 ? _l : (typeof forgeConfig.packagerConfig.icon === 'string' ? forgeConfig.packagerConfig.icon : undefined);
            let authors = (_o = (_m = this.config.packAuthors) !== null && _m !== void 0 ? _m : packageJSON.authors) !== null && _o !== void 0 ? _o : "";
            if (!authors && packageJSON.author) {
                authors = packageJSON.author;
                if (typeof authors !== "string")
                    authors = packageJSON.author.name;
            }
            const vpk_program = this.getVpkProgram();
            const vpk_args = ["pack",
                "--packId", pack_id,
                "--packVersion", version,
                "--packDir", dir,
                "--mainExe", exe_name,
                "--outputDir", outPath,
            ];
            if (this.config.channel != null)
                vpk_args.push("--channel", this.config.channel);
            if (this.config.delta != null)
                vpk_args.push("--delta", this.config.delta);
            if (this.config.exclude != null)
                vpk_args.push("--exclude", this.config.exclude);
            if (this.config.framework)
                vpk_args.push("--framework", this.config.framework.join(","));
            if (icon != null)
                vpk_args.push("--icon", icon);
            if (this.config.noInstaller)
                vpk_args.push("--noInst");
            if (this.config.noPortable)
                vpk_args.push("--noPortable");
            if (authors != null)
                vpk_args.push("--packAuthors", authors);
            if (title != null)
                vpk_args.push("--packTitle", title);
            if (this.config.releaseNotes != null)
                vpk_args.push("--releaseNotes", this.config.releaseNotes);
            if (this.config.runtime != null)
                vpk_args.push("--runtime", this.config.runtime);
            if (this.config.shortcuts)
                vpk_args.push("--shortcuts", this.config.shortcuts.join(","));
            if (this.config.signSkipDll)
                vpk_args.push("--signSkipDll");
            if (this.config.signParallel != null)
                vpk_args.push("--signParallel", this.config.signParallel.toFixed(0));
            // Note: For the sign options, we could try to get defaults from `windowsSign` or `osxSign` in packagerConfig.
            //       We don't currently do that.
            if (this.config.signParams != null)
                vpk_args.push("--signParams", this.config.signParams);
            if (this.config.signTemplate != null)
                vpk_args.push("--signTemplate", this.config.signTemplate);
            if (this.config.skipVeloAppCheck)
                vpk_args.push("--skipVeloAppCheck");
            if (this.config.splashImage != null)
                vpk_args.push("--splashImage", this.config.splashImage);
            if (this.config.vpkExtraArguments)
                vpk_args.push(...this.config.vpkExtraArguments);
            const vpk_command = assembleCommandLineForDisplay(vpk_program, vpk_args);
            try {
                // If interaction is wanted, inherit stdio to allow interactive input/output of vpk.
                // That is also why we have to use the ...Sync function here.
                (0, node_child_process_1.execFileSync)(vpk_program, vpk_args, { stdio: this.config.allowInteraction ? "inherit" : "pipe" });
            }
            catch (error) {
                const err = error instanceof Error ? error : new Error(String(error));
                const execError = err;
                throw new Error(`Could not create velopack package.\nFailed command: ${vpk_command}\n\n${(_p = execError.stdout) !== null && _p !== void 0 ? _p : ""}\n\n${(_q = execError.stderr) !== null && _q !== void 0 ? _q : err.message}\n`);
            }
            const artifacts = [
                path_1.default.resolve(outPath, 'RELEASES'),
            ];
            return artifacts;
        });
    }
    getVpkProgram() {
        var _a;
        return (_a = this.config.vpkProgram) !== null && _a !== void 0 ? _a : default_vpk_program;
    }
}
exports.default = MakerVelopack;
exports.MakerVelopack = MakerVelopack;
//# sourceMappingURL=MakerVelopack.js.map