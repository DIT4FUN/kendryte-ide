import { registerSingleton } from 'vs/platform/instantiation/common/extensions';
import { createDecorator } from 'vs/platform/instantiation/common/instantiation';
import { resolve } from 'path';
import product from 'vs/platform/node/product';
import { IEnvironmentService } from 'vs/platform/environment/common/environment';
import { isWindows } from 'vs/base/common/platform';
import { lstatSync } from 'fs';

export const INodePathService = createDecorator<INodePathService>('INodePathService');

export interface INodePathService {
	_serviceBrand: any;

	getInstallPath(): string;

	getDataPath(): string;

	exeFile(filePath: string): string;

	getToolchainBinPath(): string;

	getToolchainPath(): string;

	getSDKPath(): string;

	getPackagesPath(project?: string): string;

	rawToolchainPath(): string;

	rawSDKPath(): string;
}

class NodePathService implements INodePathService {
	_serviceBrand: any;

	private sdkPathExists: boolean;
	private toolchainPathExists: boolean;

	constructor(
		@IEnvironmentService protected environmentService: IEnvironmentService,
	) { }

	getPackagesPath(project?: string) {
		if (project) {
			return resolve(this.getInstallPath(), 'packages', project);
		} else {
			return resolve(this.getInstallPath(), 'packages');
		}
	}

	getInstallPath() {
		if (this.environmentService.isBuilt) {
			return resolve(this.environmentService.execPath, '..');
		} else {
			return resolve(this.environmentService.execPath, '../../..');
		}
	}

	getDataPath() {
		return resolve(this.environmentService.userHome, product.dataFolderName);
	}

	exeFile(filePath: string) {
		return isWindows ? filePath + '.exe' : filePath;
	}

	getToolchainBinPath() {
		const rel = this.getToolchainPath();
		return rel ? resolve(rel, 'bin') : '';
	}

	rawToolchainPath() {
		return resolve(this.getInstallPath(), 'packages/toolchain');
	}

	getToolchainPath() {
		const path = this.rawToolchainPath();
		if (this.toolchainPathExists) {
			return path;
		} else if (this.toolchainPathExists === false) {
			return '';
		}
		try {
			this.toolchainPathExists = lstatSync(resolve(path, 'bin/')).isDirectory();
		} catch (e) { // noop
		}
		if (this.toolchainPathExists) {
			console.log('%cToolchain is found at %s.', 'color:green', path);
			return path;
		} else {
			console.log('%cToolchain is expected to be found at %s, But not found.', 'color:red', path);
			return '';
		}
	}

	rawSDKPath() {
		return resolve(this.getInstallPath(), 'packages/SDK');
	}

	getSDKPath() {
		const path = this.rawSDKPath();
		if (this.sdkPathExists) {
			return path;
		} else if (this.sdkPathExists === false) {
			return '';
		}
		try {
			this.sdkPathExists = lstatSync(resolve(path, 'cmake/')).isDirectory();
		} catch (e) { // noop
		}
		if (this.sdkPathExists) {
			console.log('%cSDK is found at %s.', 'color:green', path);
			return path;
		} else {
			console.log('%cSDK is expected to be found at %s, But not found.', 'color:red', path);
			return '';
		}
	}
}

registerSingleton(INodePathService, NodePathService);