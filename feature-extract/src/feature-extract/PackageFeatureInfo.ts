import path from "path";
import promises from "fs/promises";
import { getPackageJSONInfo, type PackageJSONInfo } from "./PackageJSONInfo";
import {
  getDomainPattern,
  IP_Pattern,
  Network_Command_Pattern,
  SensitiveStringPattern,
  getDomainsType,
} from "./Patterns";
import { getAllJSFilesInInstallScript } from "./GetInstallScripts";
import { extractFeaturesFromJSFileByAST } from "./AST";
import { PositionRecorder } from "./PositionRecorder";
import { setPositionRecorder } from "../config";
import { Logger } from "../Logger";

// <= 2 MB
const ALLOWED_MAX_JS_SIZE = 1* 1024 * 1024;

/**
 * Extract features from the npm package
 * @param packagePath the directory of the npm package, where there should be a package.json file
 */
export async function getPackageFeatureInfo(
  packagePath: string,
  CallGraphFiles: string[],
  CallGraphFunctions: { [key: string]: string },
  actualPackagePath: string,
  ifCallGraphGenerated: number
): Promise<void> {
  const positionRecorder = new PositionRecorder();
  const result: PackageJSONInfo = {
    dependencyNumber: 0,
    devDependencyNumber: 0,
    includeInstallScript: false,
    installCommand: [],
    executeJSFiles: [],
  };

  try {
    if (actualPackagePath !== "") {
      const packageJSONPath = path.join(actualPackagePath, "package.json");
      await promises.access(packageJSONPath);
      const packageJSONInfo: PackageJSONInfo = await getPackageJSONInfo(
        packageJSONPath
      );
      Object.assign(result, packageJSONInfo);

      if (packageJSONInfo.includeInstallScript) {
        positionRecorder.addRecord({
          filePath: packageJSONPath,
          functionName: "packageJSON",
          featureName: "includeInstallScript",
          content: packageJSONInfo.installCommand[0],
        });
      }

      // analyze commands in the install script
      for (const scriptContent of packageJSONInfo.installCommand) {
        {
          const matchResult = scriptContent.match(IP_Pattern);
          if (matchResult != null) {
            // result.includeIP = true
            positionRecorder.addRecord({
              filePath: packageJSONPath,
              functionName: "packageJSON",
              featureName: "includeIP",
              content: scriptContent,
            });
          }
        }
        {
          const matchResult = scriptContent.match(getDomainPattern());
          if (matchResult != null) {
            const domainType = getDomainsType(matchResult);
            // if (result.includeDomainInScript < domainType) {
            //   result.includeDomainInScript = domainType
            // }
            for (const domain of matchResult) {
              positionRecorder.addRecord({
                filePath: packageJSONPath,
                functionName: "packageJSON",
                featureName: "includeDomainInScript",
                content: domain,
              });
            }
          }
        }
        {
          const matchResult = scriptContent.match(Network_Command_Pattern);
          if (matchResult != null) {
            // result.useNetworkInScript = true
            positionRecorder.addRecord({
              filePath: packageJSONPath,
              functionName: "packageJSON",
              featureName: "useNetworkInScript",
              content: scriptContent,
            });
          }
        }
        {
          const matchResult = scriptContent.match(SensitiveStringPattern);
          if (matchResult != null) {
            // result.includeSensitiveFiles = true
            for (const sensitiveString of matchResult) {
              positionRecorder.addRecord({
                filePath: packageJSONPath,
                functionName: "packageJSON",
                featureName: "includeSensitiveFiles",
                content: sensitiveString,
              });
            }
          }
        }
      }
    }
  } catch (error) {
    Logger.error(`Cannot find package.json in ${actualPackagePath}`);
  }

  // analyze JavaScript files in the install script
  await getAllJSFilesInInstallScript(result.executeJSFiles);

  async function traverseDir(baseDirPath: string, callGraphFiles: string[]) {
    for (const file of callGraphFiles) {
      const targetJSFilePath = path.join(baseDirPath, file);
      const isInstallScriptFile = result.executeJSFiles.includes(targetJSFilePath);

      // Read the file content and get the file info
      const fileInfo = await promises.stat(targetJSFilePath);
      
      // console.log('1111111Starting AST for '+ targetJSFilePath);
      if (fileInfo.size <= ALLOWED_MAX_JS_SIZE) {
        const jsFileContent = await promises.readFile(targetJSFilePath, { encoding: "utf-8" });
        // console.log(`2222222222Extracting features from file: ${targetJSFilePath}`);
        await extractFeaturesFromJSFileByAST(
          jsFileContent,
          isInstallScriptFile,
          targetJSFilePath,
          positionRecorder,
          CallGraphFiles,
          CallGraphFunctions,
          actualPackagePath,
          ifCallGraphGenerated
        );
        // console.log('33333333Completed AST for '+ targetJSFilePath);
      }
    }
    // console.log('Completed traverseDir11111111111111111111111111111111111111111111');
  }

  // Call the traverseDir function and handle the rest of the logic
  await traverseDir(actualPackagePath, CallGraphFiles);
  setPositionRecorder(positionRecorder);
  return;
}
