  // This file is part of bear-exchange.
  // SPDX-License-Identifier: Apache-2.0

  import type { MidnightProviders } from '@midnight-ntwrk/midnight-js/types';
  import type { DeployedContract, FoundContract } from '@midnight-ntwrk/midnight-js/contracts';
  import type { ProvableCircuitId } from '@midnight-ntwrk/compact-js';
  import { Contract, ledger, type Ledger } from '../../contract/dist/managed/innermost/contract/index.js';
  import type { InnermostFXPrivateState as WitnessInnermostFXPrivateState } from './witnesses.js';

  // Import private state type from witnesses
  export type InnermostFXPrivateState = WitnessInnermostFXPrivateState;

  export type InnermostFXCircuits = ProvableCircuitId<Contract<InnermostFXPrivateState>>;

  export const InnermostFXPrivateStateId = 'innermostfxPrivateState';

  export type InnermostFXProviders = MidnightProviders<InnermostFXCircuits, typeof InnermostFXPrivateStateId, InnermostFXPrivateState>;

  export type InnermostFXContract = Contract<InnermostFXPrivateState>;

  export type DeployedInnermostFXContract = DeployedContract<InnermostFXContract> | FoundContract<InnermostFXContract>;

  // Helper to get ledger state from contract
  export { ledger };

  export type InnermostFXLedger = Ledger;
