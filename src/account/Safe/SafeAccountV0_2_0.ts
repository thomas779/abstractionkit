import { SafeAccount } from "./SafeAccount";
import {
	InitCodeOverrides,
	Signer,
	CreateUserOperationV6Overrides,
} from "./types";

import { UserOperationV6, MetaTransaction } from "../../types";
import { SafeAccountFactory } from "src/factory/SafeAccountFactory";
import { ENTRYPOINT_V6 } from "src/constants";

export class SafeAccountV0_2_0 extends SafeAccount {
	static readonly DEFAULT_ENTRYPOINT_ADDRESS = ENTRYPOINT_V6;
	static readonly DEFAULT_SAFE_4337_MODULE_ADDRESS =
		"0xa581c4A4DB7175302464fF3C06380BC3270b4037";
	static readonly DEFAULT_SAFE_MODULE_SETUP_ADDRESS =
		"0x8EcD4ec46D4D2a6B64fE960B3D64e8B94B2234eb";

	constructor(
		accountAddress: string,
		overrides: {
			safe4337ModuleAddress?: string;
			entrypointAddress?: string;
		} = {},
	) {
		const safe4337ModuleAddress =
			overrides.safe4337ModuleAddress ??
			SafeAccountV0_2_0.DEFAULT_SAFE_4337_MODULE_ADDRESS;
		const entrypointAddress =
			overrides.entrypointAddress ??
			SafeAccountV0_2_0.DEFAULT_ENTRYPOINT_ADDRESS;

		super(accountAddress, safe4337ModuleAddress, entrypointAddress);
	}

	/**
	 * calculate account addressfrom initial owners
	 * @param owners - list of account owners addresses
	 * @param overrides - override values to change the initialization default values
	 * @returns account address
	 */
	public static createAccountAddress(
		owners: Signer[],
		overrides: InitCodeOverrides = {}, //mod
	): string {
		const [accountAddress, ,] =
			SafeAccount.createAccountAddressAndFactoryAddressAndData(
				owners,
				overrides,
				overrides.safe4337ModuleAddress ??
					SafeAccountV0_2_0.DEFAULT_SAFE_4337_MODULE_ADDRESS,
				overrides.safeModuleSetupddress ??
					SafeAccountV0_2_0.DEFAULT_SAFE_MODULE_SETUP_ADDRESS,
			);

		return accountAddress;
	}

	/**
	 * To create and initialize a SafeAccount object from its
	 * initial owners
	 * @remarks
	 * initializeNewAccount only needed when the smart account
	 * have not been deployed yet and the account address is unknown.
	 * @param owners - list of account owners addresses
	 * @param overrides - override values to change the initialization default values
	 * @returns a SafeAccount object
	 */
	public static initializeNewAccount(
		owners: Signer[],
		overrides: InitCodeOverrides = {},
	): SafeAccountV0_2_0 {
		let isInitWebAuthn = false;
		let x = 0n;
		let y = 0n;
		for (const owner of owners) {
			if (typeof owner != "string") {
				if (isInitWebAuthn) {
					throw RangeError(
						"Only one Webauthn signer is allowed during initialization",
					);
				}
				isInitWebAuthn = true;
				x = owner.x;
				y = owner.y;
			}
		}
		const [accountAddress, factoryAddress, factoryData] =
			SafeAccountV0_2_0.createAccountAddressAndFactoryAddressAndData(
				owners,
				overrides,
				overrides.safe4337ModuleAddress ??
					SafeAccountV0_2_0.DEFAULT_SAFE_4337_MODULE_ADDRESS,
				overrides.safeModuleSetupddress ??
					SafeAccountV0_2_0.DEFAULT_SAFE_MODULE_SETUP_ADDRESS,
			);

		const safe = new SafeAccountV0_2_0(accountAddress, {
			safe4337ModuleAddress: overrides.safe4337ModuleAddress,
			entrypointAddress: overrides.entrypointAddress,
		});
		safe.factoryAddress = factoryAddress;
		safe.factoryData = factoryData;
		if (isInitWebAuthn) {
			safe.isInitWebAuthn = isInitWebAuthn;
			safe.x = x;
			safe.y = y;
		}

		return safe;
	}

	public static getUserOperationEip712Hash(
		useroperation: UserOperationV6,
		chainId: bigint,
		overrides: {
			validAfter?: bigint;
			validUntil?: bigint;
			entrypointAddress?: string;
			safe4337ModuleAddress?: string;
		} = {},
	): string {
		const validAfter = overrides.validAfter ?? 0n;
		const validUntil = overrides.validUntil ?? 0n;
		const entrypointAddress =
			overrides.entrypointAddress ??
			SafeAccountV0_2_0.DEFAULT_ENTRYPOINT_ADDRESS;
		const safe4337ModuleAddress =
			overrides.safe4337ModuleAddress ??
			SafeAccountV0_2_0.DEFAULT_SAFE_4337_MODULE_ADDRESS;

		return SafeAccount.getUserOperationEip712Hash(useroperation, chainId, {
			validAfter,
			validUntil,
			entrypointAddress,
			safe4337ModuleAddress,
		});
	}

	/**
	 * calculate account address and initcode from owners
	 * @param owners - list of account owners addresses
	 * @param overrides - override values to change the initialization default values
	 * @returns account address and initcode
	 */
	public static createAccountAddressAndInitCode(
		owners: Signer[],
		overrides: InitCodeOverrides,
	): [string, string] {
		let safeAccountFactory;
		if (overrides.safeAccountFactoryAddress != null) {
			safeAccountFactory = new SafeAccountFactory(
				overrides.safeAccountFactoryAddress,
			);
		} else {
			safeAccountFactory = new SafeAccountFactory();
		}

		let [sender, safeAccountFactoryAddress, factoryData] =
			SafeAccount.createAccountAddressAndFactoryAddressAndData(
				owners,
				overrides,
				overrides.safe4337ModuleAddress ??
					SafeAccountV0_2_0.DEFAULT_SAFE_4337_MODULE_ADDRESS,
				overrides.safeModuleSetupddress ??
					SafeAccountV0_2_0.DEFAULT_SAFE_MODULE_SETUP_ADDRESS,
			);

		let initCode = safeAccountFactoryAddress + factoryData.slice(2);
		return [sender, initCode];
	}

	public static createInitializerCallData(
		owners: Signer[],
		threshold: number,
		overrides: {
			safe4337ModuleAddress?: string;
			safeModuleSetupddress?: string;
			multisendContractAddress?: string;
			webAuthnSharedSigner?: string;
			eip7212WebAuthnPrecompileVerifierForSharedSigner?: string;
			eip7212WebAuthnContractVerifierForSharedSigner?: string;
		} = {},
	): string {
		const safe4337ModuleAddress =
			overrides.safe4337ModuleAddress ??
			SafeAccountV0_2_0.DEFAULT_SAFE_4337_MODULE_ADDRESS;
		const safeModuleSetupddress =
			overrides.safeModuleSetupddress ??
			SafeAccountV0_2_0.DEFAULT_SAFE_MODULE_SETUP_ADDRESS;

		return SafeAccount.createBaseInitializerCallData(
			owners,
			threshold,
			safe4337ModuleAddress,
			safeModuleSetupddress,
			overrides.multisendContractAddress,
			overrides.webAuthnSharedSigner,
			overrides.eip7212WebAuthnPrecompileVerifierForSharedSigner,
			overrides.eip7212WebAuthnContractVerifierForSharedSigner,
		);
	}

	/**
	 * create account initcode
	 * @param owners - list of account owners addresses
	 * @param overrides - overrides values to change default values
	 * @returns initcode
	 */
	public static createInitCode(
		owners: Signer[],
		overrides: InitCodeOverrides,
	): string {
		let [safeAccountFactoryAddress, factoryData] =
			SafeAccount.createFactoryAddressAndData(
				owners,
				overrides,
				overrides.safe4337ModuleAddress ??
					SafeAccountV0_2_0.DEFAULT_SAFE_4337_MODULE_ADDRESS,
				overrides.safeModuleSetupddress ??
					SafeAccountV0_2_0.DEFAULT_SAFE_MODULE_SETUP_ADDRESS,
			);
		return safeAccountFactoryAddress + factoryData.slice(2);
	}

	/**
	 * createUserOperation will determine the nonce, fetch the gas prices,
	 * estimate gas limits and return a useroperation to be signed.
	 * you can override all these values using the overrides parameter.
	 * @param transactions - metatransaction list to be encoded
	 * @param providerRpc - node rpc to fetch account nonce and gas prices
	 * @param bundlerRpc - bundler rpc for gas estimation
	 * @param overrides - overrides values to change default values
	 * @returns promise with useroperation
	 */
	public async createUserOperation(
		transactions: MetaTransaction[],
		providerRpc?: string,
		bundlerRpc?: string,
		overrides: CreateUserOperationV6Overrides = {},
	): Promise<UserOperationV6> {
		let [userOperation, factoryAddress, factoryData] =
			await this.createBaseUserOperationAndFactoryAddressAndFactoryData(
				transactions,
				true,
				providerRpc,
				bundlerRpc,
				overrides,
			);

		let initCode = "0x";

		if (overrides.initCode == null) {
			if (factoryAddress != null) {
				let factoryDataStr = "0x";
				if (factoryData != null) {
					factoryDataStr = factoryData;
				}
				initCode = factoryAddress + factoryDataStr.slice(2);
			}
		} else {
			initCode = overrides.initCode;
		}

		const userOperationV6: UserOperationV6 = {
			...userOperation,
			initCode,
			paymasterAndData: "0x",
		};

		return userOperationV6;
	}
}
