import * as __compactRuntime from '@midnight-ntwrk/compact-runtime';
__compactRuntime.checkRuntimeVersion('0.15.0');

const _descriptor_0 = new __compactRuntime.CompactTypeBytes(32);

const _descriptor_1 = new __compactRuntime.CompactTypeUnsignedInteger(18446744073709551615n, 8);

const _descriptor_2 = __compactRuntime.CompactTypeBoolean;

class _ZswapCoinPublicKey_0 {
  alignment() {
    return _descriptor_0.alignment();
  }
  fromValue(value_0) {
    return {
      bytes: _descriptor_0.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_0.toValue(value_0.bytes);
  }
}

const _descriptor_3 = new _ZswapCoinPublicKey_0();

class _ContractAddress_0 {
  alignment() {
    return _descriptor_0.alignment();
  }
  fromValue(value_0) {
    return {
      bytes: _descriptor_0.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_0.toValue(value_0.bytes);
  }
}

const _descriptor_4 = new _ContractAddress_0();

class _Either_0 {
  alignment() {
    return _descriptor_2.alignment().concat(_descriptor_3.alignment().concat(_descriptor_4.alignment()));
  }
  fromValue(value_0) {
    return {
      is_left: _descriptor_2.fromValue(value_0),
      left: _descriptor_3.fromValue(value_0),
      right: _descriptor_4.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_2.toValue(value_0.is_left).concat(_descriptor_3.toValue(value_0.left).concat(_descriptor_4.toValue(value_0.right)));
  }
}

const _descriptor_5 = new _Either_0();

const _descriptor_6 = new __compactRuntime.CompactTypeVector(2, _descriptor_0);

const _descriptor_7 = new __compactRuntime.CompactTypeUnsignedInteger(340282366920938463463374607431768211455n, 16);

class _ShieldedCoinInfo_0 {
  alignment() {
    return _descriptor_0.alignment().concat(_descriptor_0.alignment().concat(_descriptor_7.alignment()));
  }
  fromValue(value_0) {
    return {
      nonce: _descriptor_0.fromValue(value_0),
      color: _descriptor_0.fromValue(value_0),
      value: _descriptor_7.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_0.toValue(value_0.nonce).concat(_descriptor_0.toValue(value_0.color).concat(_descriptor_7.toValue(value_0.value)));
  }
}

const _descriptor_8 = new _ShieldedCoinInfo_0();

const _descriptor_9 = new __compactRuntime.CompactTypeBytes(21);

class _CoinPreimage_0 {
  alignment() {
    return _descriptor_9.alignment().concat(_descriptor_8.alignment().concat(_descriptor_2.alignment().concat(_descriptor_0.alignment())));
  }
  fromValue(value_0) {
    return {
      domain_sep: _descriptor_9.fromValue(value_0),
      info: _descriptor_8.fromValue(value_0),
      dataType: _descriptor_2.fromValue(value_0),
      data: _descriptor_0.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_9.toValue(value_0.domain_sep).concat(_descriptor_8.toValue(value_0.info).concat(_descriptor_2.toValue(value_0.dataType).concat(_descriptor_0.toValue(value_0.data))));
  }
}

const _descriptor_10 = new _CoinPreimage_0();

const _descriptor_11 = new __compactRuntime.CompactTypeVector(6, _descriptor_0);

class _Either_1 {
  alignment() {
    return _descriptor_2.alignment().concat(_descriptor_0.alignment().concat(_descriptor_0.alignment()));
  }
  fromValue(value_0) {
    return {
      is_left: _descriptor_2.fromValue(value_0),
      left: _descriptor_0.fromValue(value_0),
      right: _descriptor_0.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_2.toValue(value_0.is_left).concat(_descriptor_0.toValue(value_0.left).concat(_descriptor_0.toValue(value_0.right)));
  }
}

const _descriptor_12 = new _Either_1();

const _descriptor_13 = new __compactRuntime.CompactTypeUnsignedInteger(255n, 1);

export class Contract {
  witnesses;
  constructor(...args_0) {
    if (args_0.length !== 1) {
      throw new __compactRuntime.CompactError(`Contract constructor: expected 1 argument, received ${args_0.length}`);
    }
    const witnesses_0 = args_0[0];
    if (typeof(witnesses_0) !== 'object') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor is not an object');
    }
    if (typeof(witnesses_0.localSk) !== 'function') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor does not contain a function-valued field named localSk');
    }
    if (typeof(witnesses_0.askSk) !== 'function') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor does not contain a function-valued field named askSk');
    }
    if (typeof(witnesses_0.witDivide) !== 'function') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor does not contain a function-valued field named witDivide');
    }
    this.witnesses = witnesses_0;
    this.circuits = {
      getDappPubKey(context, ...args_1) {
        return { result: pureCircuits.getDappPubKey(...args_1), context };
      },
      mintUSD: (...args_1) => {
        if (args_1.length !== 4) {
          throw new __compactRuntime.CompactError(`mintUSD: expected 4 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const amount_0 = args_1[1];
        const recipient_0 = args_1[2];
        const nonce_0 = args_1[3];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.currentQueryContext != undefined)) {
          __compactRuntime.typeError('mintUSD',
                                     'argument 1 (as invoked from Typescript)',
                                     'InnermostFX.compact line 188 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(typeof(amount_0) === 'bigint' && amount_0 >= 0n && amount_0 <= 18446744073709551615n)) {
          __compactRuntime.typeError('mintUSD',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'InnermostFX.compact line 188 char 1',
                                     'Uint<0..18446744073709551616>',
                                     amount_0)
        }
        if (!(typeof(recipient_0) === 'object' && typeof(recipient_0.is_left) === 'boolean' && typeof(recipient_0.left) === 'object' && recipient_0.left.bytes.buffer instanceof ArrayBuffer && recipient_0.left.bytes.BYTES_PER_ELEMENT === 1 && recipient_0.left.bytes.length === 32 && typeof(recipient_0.right) === 'object' && recipient_0.right.bytes.buffer instanceof ArrayBuffer && recipient_0.right.bytes.BYTES_PER_ELEMENT === 1 && recipient_0.right.bytes.length === 32)) {
          __compactRuntime.typeError('mintUSD',
                                     'argument 2 (argument 3 as invoked from Typescript)',
                                     'InnermostFX.compact line 188 char 1',
                                     'struct Either<is_left: Boolean, left: struct ZswapCoinPublicKey<bytes: Bytes<32>>, right: struct ContractAddress<bytes: Bytes<32>>>',
                                     recipient_0)
        }
        if (!(nonce_0.buffer instanceof ArrayBuffer && nonce_0.BYTES_PER_ELEMENT === 1 && nonce_0.length === 32)) {
          __compactRuntime.typeError('mintUSD',
                                     'argument 3 (argument 4 as invoked from Typescript)',
                                     'InnermostFX.compact line 188 char 1',
                                     'Bytes<32>',
                                     nonce_0)
        }
        const context = { ...contextOrig_0, gasCost: __compactRuntime.emptyRunningCost() };
        const partialProofData = {
          input: {
            value: _descriptor_1.toValue(amount_0).concat(_descriptor_5.toValue(recipient_0).concat(_descriptor_0.toValue(nonce_0))),
            alignment: _descriptor_1.alignment().concat(_descriptor_5.alignment().concat(_descriptor_0.alignment()))
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = this._mintUSD_0(context,
                                         partialProofData,
                                         amount_0,
                                         recipient_0,
                                         nonce_0);
        partialProofData.output = { value: [], alignment: [] };
        return { result: result_0, context: context, proofData: partialProofData, gasCost: context.gasCost };
      },
      mintEUR: (...args_1) => {
        if (args_1.length !== 4) {
          throw new __compactRuntime.CompactError(`mintEUR: expected 4 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const amount_0 = args_1[1];
        const recipient_0 = args_1[2];
        const nonce_0 = args_1[3];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.currentQueryContext != undefined)) {
          __compactRuntime.typeError('mintEUR',
                                     'argument 1 (as invoked from Typescript)',
                                     'InnermostFX.compact line 197 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(typeof(amount_0) === 'bigint' && amount_0 >= 0n && amount_0 <= 18446744073709551615n)) {
          __compactRuntime.typeError('mintEUR',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'InnermostFX.compact line 197 char 1',
                                     'Uint<0..18446744073709551616>',
                                     amount_0)
        }
        if (!(typeof(recipient_0) === 'object' && typeof(recipient_0.is_left) === 'boolean' && typeof(recipient_0.left) === 'object' && recipient_0.left.bytes.buffer instanceof ArrayBuffer && recipient_0.left.bytes.BYTES_PER_ELEMENT === 1 && recipient_0.left.bytes.length === 32 && typeof(recipient_0.right) === 'object' && recipient_0.right.bytes.buffer instanceof ArrayBuffer && recipient_0.right.bytes.BYTES_PER_ELEMENT === 1 && recipient_0.right.bytes.length === 32)) {
          __compactRuntime.typeError('mintEUR',
                                     'argument 2 (argument 3 as invoked from Typescript)',
                                     'InnermostFX.compact line 197 char 1',
                                     'struct Either<is_left: Boolean, left: struct ZswapCoinPublicKey<bytes: Bytes<32>>, right: struct ContractAddress<bytes: Bytes<32>>>',
                                     recipient_0)
        }
        if (!(nonce_0.buffer instanceof ArrayBuffer && nonce_0.BYTES_PER_ELEMENT === 1 && nonce_0.length === 32)) {
          __compactRuntime.typeError('mintEUR',
                                     'argument 3 (argument 4 as invoked from Typescript)',
                                     'InnermostFX.compact line 197 char 1',
                                     'Bytes<32>',
                                     nonce_0)
        }
        const context = { ...contextOrig_0, gasCost: __compactRuntime.emptyRunningCost() };
        const partialProofData = {
          input: {
            value: _descriptor_1.toValue(amount_0).concat(_descriptor_5.toValue(recipient_0).concat(_descriptor_0.toValue(nonce_0))),
            alignment: _descriptor_1.alignment().concat(_descriptor_5.alignment().concat(_descriptor_0.alignment()))
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = this._mintEUR_0(context,
                                         partialProofData,
                                         amount_0,
                                         recipient_0,
                                         nonce_0);
        partialProofData.output = { value: [], alignment: [] };
        return { result: result_0, context: context, proofData: partialProofData, gasCost: context.gasCost };
      },
      mintJPY: (...args_1) => {
        if (args_1.length !== 4) {
          throw new __compactRuntime.CompactError(`mintJPY: expected 4 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const amount_0 = args_1[1];
        const recipient_0 = args_1[2];
        const nonce_0 = args_1[3];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.currentQueryContext != undefined)) {
          __compactRuntime.typeError('mintJPY',
                                     'argument 1 (as invoked from Typescript)',
                                     'InnermostFX.compact line 206 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(typeof(amount_0) === 'bigint' && amount_0 >= 0n && amount_0 <= 18446744073709551615n)) {
          __compactRuntime.typeError('mintJPY',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'InnermostFX.compact line 206 char 1',
                                     'Uint<0..18446744073709551616>',
                                     amount_0)
        }
        if (!(typeof(recipient_0) === 'object' && typeof(recipient_0.is_left) === 'boolean' && typeof(recipient_0.left) === 'object' && recipient_0.left.bytes.buffer instanceof ArrayBuffer && recipient_0.left.bytes.BYTES_PER_ELEMENT === 1 && recipient_0.left.bytes.length === 32 && typeof(recipient_0.right) === 'object' && recipient_0.right.bytes.buffer instanceof ArrayBuffer && recipient_0.right.bytes.BYTES_PER_ELEMENT === 1 && recipient_0.right.bytes.length === 32)) {
          __compactRuntime.typeError('mintJPY',
                                     'argument 2 (argument 3 as invoked from Typescript)',
                                     'InnermostFX.compact line 206 char 1',
                                     'struct Either<is_left: Boolean, left: struct ZswapCoinPublicKey<bytes: Bytes<32>>, right: struct ContractAddress<bytes: Bytes<32>>>',
                                     recipient_0)
        }
        if (!(nonce_0.buffer instanceof ArrayBuffer && nonce_0.BYTES_PER_ELEMENT === 1 && nonce_0.length === 32)) {
          __compactRuntime.typeError('mintJPY',
                                     'argument 3 (argument 4 as invoked from Typescript)',
                                     'InnermostFX.compact line 206 char 1',
                                     'Bytes<32>',
                                     nonce_0)
        }
        const context = { ...contextOrig_0, gasCost: __compactRuntime.emptyRunningCost() };
        const partialProofData = {
          input: {
            value: _descriptor_1.toValue(amount_0).concat(_descriptor_5.toValue(recipient_0).concat(_descriptor_0.toValue(nonce_0))),
            alignment: _descriptor_1.alignment().concat(_descriptor_5.alignment().concat(_descriptor_0.alignment()))
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = this._mintJPY_0(context,
                                         partialProofData,
                                         amount_0,
                                         recipient_0,
                                         nonce_0);
        partialProofData.output = { value: [], alignment: [] };
        return { result: result_0, context: context, proofData: partialProofData, gasCost: context.gasCost };
      },
      createOrder: (...args_1) => {
        if (args_1.length !== 6) {
          throw new __compactRuntime.CompactError(`createOrder: expected 6 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const pair_0 = args_1[1];
        const direction_0 = args_1[2];
        const price_0 = args_1[3];
        const amount_0 = args_1[4];
        const nonce_0 = args_1[5];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.currentQueryContext != undefined)) {
          __compactRuntime.typeError('createOrder',
                                     'argument 1 (as invoked from Typescript)',
                                     'InnermostFX.compact line 269 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(pair_0.buffer instanceof ArrayBuffer && pair_0.BYTES_PER_ELEMENT === 1 && pair_0.length === 32)) {
          __compactRuntime.typeError('createOrder',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'InnermostFX.compact line 269 char 1',
                                     'Bytes<32>',
                                     pair_0)
        }
        if (!(direction_0.buffer instanceof ArrayBuffer && direction_0.BYTES_PER_ELEMENT === 1 && direction_0.length === 32)) {
          __compactRuntime.typeError('createOrder',
                                     'argument 2 (argument 3 as invoked from Typescript)',
                                     'InnermostFX.compact line 269 char 1',
                                     'Bytes<32>',
                                     direction_0)
        }
        if (!(typeof(price_0) === 'bigint' && price_0 >= 0n && price_0 <= 18446744073709551615n)) {
          __compactRuntime.typeError('createOrder',
                                     'argument 3 (argument 4 as invoked from Typescript)',
                                     'InnermostFX.compact line 269 char 1',
                                     'Uint<0..18446744073709551616>',
                                     price_0)
        }
        if (!(typeof(amount_0) === 'bigint' && amount_0 >= 0n && amount_0 <= 18446744073709551615n)) {
          __compactRuntime.typeError('createOrder',
                                     'argument 4 (argument 5 as invoked from Typescript)',
                                     'InnermostFX.compact line 269 char 1',
                                     'Uint<0..18446744073709551616>',
                                     amount_0)
        }
        if (!(nonce_0.buffer instanceof ArrayBuffer && nonce_0.BYTES_PER_ELEMENT === 1 && nonce_0.length === 32)) {
          __compactRuntime.typeError('createOrder',
                                     'argument 5 (argument 6 as invoked from Typescript)',
                                     'InnermostFX.compact line 269 char 1',
                                     'Bytes<32>',
                                     nonce_0)
        }
        const context = { ...contextOrig_0, gasCost: __compactRuntime.emptyRunningCost() };
        const partialProofData = {
          input: {
            value: _descriptor_0.toValue(pair_0).concat(_descriptor_0.toValue(direction_0).concat(_descriptor_1.toValue(price_0).concat(_descriptor_1.toValue(amount_0).concat(_descriptor_0.toValue(nonce_0))))),
            alignment: _descriptor_0.alignment().concat(_descriptor_0.alignment().concat(_descriptor_1.alignment().concat(_descriptor_1.alignment().concat(_descriptor_0.alignment()))))
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = this._createOrder_0(context,
                                             partialProofData,
                                             pair_0,
                                             direction_0,
                                             price_0,
                                             amount_0,
                                             nonce_0);
        partialProofData.output = { value: [], alignment: [] };
        return { result: result_0, context: context, proofData: partialProofData, gasCost: context.gasCost };
      },
      batchCreateOrders2: (...args_1) => {
        if (args_1.length !== 11) {
          throw new __compactRuntime.CompactError(`batchCreateOrders2: expected 11 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const pair1_0 = args_1[1];
        const direction1_0 = args_1[2];
        const price1_0 = args_1[3];
        const amount1_0 = args_1[4];
        const nonce1_0 = args_1[5];
        const pair2_0 = args_1[6];
        const direction2_0 = args_1[7];
        const price2_0 = args_1[8];
        const amount2_0 = args_1[9];
        const nonce2_0 = args_1[10];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.currentQueryContext != undefined)) {
          __compactRuntime.typeError('batchCreateOrders2',
                                     'argument 1 (as invoked from Typescript)',
                                     'InnermostFX.compact line 285 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(pair1_0.buffer instanceof ArrayBuffer && pair1_0.BYTES_PER_ELEMENT === 1 && pair1_0.length === 32)) {
          __compactRuntime.typeError('batchCreateOrders2',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'InnermostFX.compact line 285 char 1',
                                     'Bytes<32>',
                                     pair1_0)
        }
        if (!(direction1_0.buffer instanceof ArrayBuffer && direction1_0.BYTES_PER_ELEMENT === 1 && direction1_0.length === 32)) {
          __compactRuntime.typeError('batchCreateOrders2',
                                     'argument 2 (argument 3 as invoked from Typescript)',
                                     'InnermostFX.compact line 285 char 1',
                                     'Bytes<32>',
                                     direction1_0)
        }
        if (!(typeof(price1_0) === 'bigint' && price1_0 >= 0n && price1_0 <= 18446744073709551615n)) {
          __compactRuntime.typeError('batchCreateOrders2',
                                     'argument 3 (argument 4 as invoked from Typescript)',
                                     'InnermostFX.compact line 285 char 1',
                                     'Uint<0..18446744073709551616>',
                                     price1_0)
        }
        if (!(typeof(amount1_0) === 'bigint' && amount1_0 >= 0n && amount1_0 <= 18446744073709551615n)) {
          __compactRuntime.typeError('batchCreateOrders2',
                                     'argument 4 (argument 5 as invoked from Typescript)',
                                     'InnermostFX.compact line 285 char 1',
                                     'Uint<0..18446744073709551616>',
                                     amount1_0)
        }
        if (!(nonce1_0.buffer instanceof ArrayBuffer && nonce1_0.BYTES_PER_ELEMENT === 1 && nonce1_0.length === 32)) {
          __compactRuntime.typeError('batchCreateOrders2',
                                     'argument 5 (argument 6 as invoked from Typescript)',
                                     'InnermostFX.compact line 285 char 1',
                                     'Bytes<32>',
                                     nonce1_0)
        }
        if (!(pair2_0.buffer instanceof ArrayBuffer && pair2_0.BYTES_PER_ELEMENT === 1 && pair2_0.length === 32)) {
          __compactRuntime.typeError('batchCreateOrders2',
                                     'argument 6 (argument 7 as invoked from Typescript)',
                                     'InnermostFX.compact line 285 char 1',
                                     'Bytes<32>',
                                     pair2_0)
        }
        if (!(direction2_0.buffer instanceof ArrayBuffer && direction2_0.BYTES_PER_ELEMENT === 1 && direction2_0.length === 32)) {
          __compactRuntime.typeError('batchCreateOrders2',
                                     'argument 7 (argument 8 as invoked from Typescript)',
                                     'InnermostFX.compact line 285 char 1',
                                     'Bytes<32>',
                                     direction2_0)
        }
        if (!(typeof(price2_0) === 'bigint' && price2_0 >= 0n && price2_0 <= 18446744073709551615n)) {
          __compactRuntime.typeError('batchCreateOrders2',
                                     'argument 8 (argument 9 as invoked from Typescript)',
                                     'InnermostFX.compact line 285 char 1',
                                     'Uint<0..18446744073709551616>',
                                     price2_0)
        }
        if (!(typeof(amount2_0) === 'bigint' && amount2_0 >= 0n && amount2_0 <= 18446744073709551615n)) {
          __compactRuntime.typeError('batchCreateOrders2',
                                     'argument 9 (argument 10 as invoked from Typescript)',
                                     'InnermostFX.compact line 285 char 1',
                                     'Uint<0..18446744073709551616>',
                                     amount2_0)
        }
        if (!(nonce2_0.buffer instanceof ArrayBuffer && nonce2_0.BYTES_PER_ELEMENT === 1 && nonce2_0.length === 32)) {
          __compactRuntime.typeError('batchCreateOrders2',
                                     'argument 10 (argument 11 as invoked from Typescript)',
                                     'InnermostFX.compact line 285 char 1',
                                     'Bytes<32>',
                                     nonce2_0)
        }
        const context = { ...contextOrig_0, gasCost: __compactRuntime.emptyRunningCost() };
        const partialProofData = {
          input: {
            value: _descriptor_0.toValue(pair1_0).concat(_descriptor_0.toValue(direction1_0).concat(_descriptor_1.toValue(price1_0).concat(_descriptor_1.toValue(amount1_0).concat(_descriptor_0.toValue(nonce1_0).concat(_descriptor_0.toValue(pair2_0).concat(_descriptor_0.toValue(direction2_0).concat(_descriptor_1.toValue(price2_0).concat(_descriptor_1.toValue(amount2_0).concat(_descriptor_0.toValue(nonce2_0)))))))))),
            alignment: _descriptor_0.alignment().concat(_descriptor_0.alignment().concat(_descriptor_1.alignment().concat(_descriptor_1.alignment().concat(_descriptor_0.alignment().concat(_descriptor_0.alignment().concat(_descriptor_0.alignment().concat(_descriptor_1.alignment().concat(_descriptor_1.alignment().concat(_descriptor_0.alignment())))))))))
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = this._batchCreateOrders2_0(context,
                                                    partialProofData,
                                                    pair1_0,
                                                    direction1_0,
                                                    price1_0,
                                                    amount1_0,
                                                    nonce1_0,
                                                    pair2_0,
                                                    direction2_0,
                                                    price2_0,
                                                    amount2_0,
                                                    nonce2_0);
        partialProofData.output = { value: [], alignment: [] };
        return { result: result_0, context: context, proofData: partialProofData, gasCost: context.gasCost };
      },
      batchCreateOrders4: (...args_1) => {
        if (args_1.length !== 21) {
          throw new __compactRuntime.CompactError(`batchCreateOrders4: expected 21 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const pair1_0 = args_1[1];
        const direction1_0 = args_1[2];
        const price1_0 = args_1[3];
        const amount1_0 = args_1[4];
        const nonce1_0 = args_1[5];
        const pair2_0 = args_1[6];
        const direction2_0 = args_1[7];
        const price2_0 = args_1[8];
        const amount2_0 = args_1[9];
        const nonce2_0 = args_1[10];
        const pair3_0 = args_1[11];
        const direction3_0 = args_1[12];
        const price3_0 = args_1[13];
        const amount3_0 = args_1[14];
        const nonce3_0 = args_1[15];
        const pair4_0 = args_1[16];
        const direction4_0 = args_1[17];
        const price4_0 = args_1[18];
        const amount4_0 = args_1[19];
        const nonce4_0 = args_1[20];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.currentQueryContext != undefined)) {
          __compactRuntime.typeError('batchCreateOrders4',
                                     'argument 1 (as invoked from Typescript)',
                                     'InnermostFX.compact line 294 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(pair1_0.buffer instanceof ArrayBuffer && pair1_0.BYTES_PER_ELEMENT === 1 && pair1_0.length === 32)) {
          __compactRuntime.typeError('batchCreateOrders4',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'InnermostFX.compact line 294 char 1',
                                     'Bytes<32>',
                                     pair1_0)
        }
        if (!(direction1_0.buffer instanceof ArrayBuffer && direction1_0.BYTES_PER_ELEMENT === 1 && direction1_0.length === 32)) {
          __compactRuntime.typeError('batchCreateOrders4',
                                     'argument 2 (argument 3 as invoked from Typescript)',
                                     'InnermostFX.compact line 294 char 1',
                                     'Bytes<32>',
                                     direction1_0)
        }
        if (!(typeof(price1_0) === 'bigint' && price1_0 >= 0n && price1_0 <= 18446744073709551615n)) {
          __compactRuntime.typeError('batchCreateOrders4',
                                     'argument 3 (argument 4 as invoked from Typescript)',
                                     'InnermostFX.compact line 294 char 1',
                                     'Uint<0..18446744073709551616>',
                                     price1_0)
        }
        if (!(typeof(amount1_0) === 'bigint' && amount1_0 >= 0n && amount1_0 <= 18446744073709551615n)) {
          __compactRuntime.typeError('batchCreateOrders4',
                                     'argument 4 (argument 5 as invoked from Typescript)',
                                     'InnermostFX.compact line 294 char 1',
                                     'Uint<0..18446744073709551616>',
                                     amount1_0)
        }
        if (!(nonce1_0.buffer instanceof ArrayBuffer && nonce1_0.BYTES_PER_ELEMENT === 1 && nonce1_0.length === 32)) {
          __compactRuntime.typeError('batchCreateOrders4',
                                     'argument 5 (argument 6 as invoked from Typescript)',
                                     'InnermostFX.compact line 294 char 1',
                                     'Bytes<32>',
                                     nonce1_0)
        }
        if (!(pair2_0.buffer instanceof ArrayBuffer && pair2_0.BYTES_PER_ELEMENT === 1 && pair2_0.length === 32)) {
          __compactRuntime.typeError('batchCreateOrders4',
                                     'argument 6 (argument 7 as invoked from Typescript)',
                                     'InnermostFX.compact line 294 char 1',
                                     'Bytes<32>',
                                     pair2_0)
        }
        if (!(direction2_0.buffer instanceof ArrayBuffer && direction2_0.BYTES_PER_ELEMENT === 1 && direction2_0.length === 32)) {
          __compactRuntime.typeError('batchCreateOrders4',
                                     'argument 7 (argument 8 as invoked from Typescript)',
                                     'InnermostFX.compact line 294 char 1',
                                     'Bytes<32>',
                                     direction2_0)
        }
        if (!(typeof(price2_0) === 'bigint' && price2_0 >= 0n && price2_0 <= 18446744073709551615n)) {
          __compactRuntime.typeError('batchCreateOrders4',
                                     'argument 8 (argument 9 as invoked from Typescript)',
                                     'InnermostFX.compact line 294 char 1',
                                     'Uint<0..18446744073709551616>',
                                     price2_0)
        }
        if (!(typeof(amount2_0) === 'bigint' && amount2_0 >= 0n && amount2_0 <= 18446744073709551615n)) {
          __compactRuntime.typeError('batchCreateOrders4',
                                     'argument 9 (argument 10 as invoked from Typescript)',
                                     'InnermostFX.compact line 294 char 1',
                                     'Uint<0..18446744073709551616>',
                                     amount2_0)
        }
        if (!(nonce2_0.buffer instanceof ArrayBuffer && nonce2_0.BYTES_PER_ELEMENT === 1 && nonce2_0.length === 32)) {
          __compactRuntime.typeError('batchCreateOrders4',
                                     'argument 10 (argument 11 as invoked from Typescript)',
                                     'InnermostFX.compact line 294 char 1',
                                     'Bytes<32>',
                                     nonce2_0)
        }
        if (!(pair3_0.buffer instanceof ArrayBuffer && pair3_0.BYTES_PER_ELEMENT === 1 && pair3_0.length === 32)) {
          __compactRuntime.typeError('batchCreateOrders4',
                                     'argument 11 (argument 12 as invoked from Typescript)',
                                     'InnermostFX.compact line 294 char 1',
                                     'Bytes<32>',
                                     pair3_0)
        }
        if (!(direction3_0.buffer instanceof ArrayBuffer && direction3_0.BYTES_PER_ELEMENT === 1 && direction3_0.length === 32)) {
          __compactRuntime.typeError('batchCreateOrders4',
                                     'argument 12 (argument 13 as invoked from Typescript)',
                                     'InnermostFX.compact line 294 char 1',
                                     'Bytes<32>',
                                     direction3_0)
        }
        if (!(typeof(price3_0) === 'bigint' && price3_0 >= 0n && price3_0 <= 18446744073709551615n)) {
          __compactRuntime.typeError('batchCreateOrders4',
                                     'argument 13 (argument 14 as invoked from Typescript)',
                                     'InnermostFX.compact line 294 char 1',
                                     'Uint<0..18446744073709551616>',
                                     price3_0)
        }
        if (!(typeof(amount3_0) === 'bigint' && amount3_0 >= 0n && amount3_0 <= 18446744073709551615n)) {
          __compactRuntime.typeError('batchCreateOrders4',
                                     'argument 14 (argument 15 as invoked from Typescript)',
                                     'InnermostFX.compact line 294 char 1',
                                     'Uint<0..18446744073709551616>',
                                     amount3_0)
        }
        if (!(nonce3_0.buffer instanceof ArrayBuffer && nonce3_0.BYTES_PER_ELEMENT === 1 && nonce3_0.length === 32)) {
          __compactRuntime.typeError('batchCreateOrders4',
                                     'argument 15 (argument 16 as invoked from Typescript)',
                                     'InnermostFX.compact line 294 char 1',
                                     'Bytes<32>',
                                     nonce3_0)
        }
        if (!(pair4_0.buffer instanceof ArrayBuffer && pair4_0.BYTES_PER_ELEMENT === 1 && pair4_0.length === 32)) {
          __compactRuntime.typeError('batchCreateOrders4',
                                     'argument 16 (argument 17 as invoked from Typescript)',
                                     'InnermostFX.compact line 294 char 1',
                                     'Bytes<32>',
                                     pair4_0)
        }
        if (!(direction4_0.buffer instanceof ArrayBuffer && direction4_0.BYTES_PER_ELEMENT === 1 && direction4_0.length === 32)) {
          __compactRuntime.typeError('batchCreateOrders4',
                                     'argument 17 (argument 18 as invoked from Typescript)',
                                     'InnermostFX.compact line 294 char 1',
                                     'Bytes<32>',
                                     direction4_0)
        }
        if (!(typeof(price4_0) === 'bigint' && price4_0 >= 0n && price4_0 <= 18446744073709551615n)) {
          __compactRuntime.typeError('batchCreateOrders4',
                                     'argument 18 (argument 19 as invoked from Typescript)',
                                     'InnermostFX.compact line 294 char 1',
                                     'Uint<0..18446744073709551616>',
                                     price4_0)
        }
        if (!(typeof(amount4_0) === 'bigint' && amount4_0 >= 0n && amount4_0 <= 18446744073709551615n)) {
          __compactRuntime.typeError('batchCreateOrders4',
                                     'argument 19 (argument 20 as invoked from Typescript)',
                                     'InnermostFX.compact line 294 char 1',
                                     'Uint<0..18446744073709551616>',
                                     amount4_0)
        }
        if (!(nonce4_0.buffer instanceof ArrayBuffer && nonce4_0.BYTES_PER_ELEMENT === 1 && nonce4_0.length === 32)) {
          __compactRuntime.typeError('batchCreateOrders4',
                                     'argument 20 (argument 21 as invoked from Typescript)',
                                     'InnermostFX.compact line 294 char 1',
                                     'Bytes<32>',
                                     nonce4_0)
        }
        const context = { ...contextOrig_0, gasCost: __compactRuntime.emptyRunningCost() };
        const partialProofData = {
          input: {
            value: _descriptor_0.toValue(pair1_0).concat(_descriptor_0.toValue(direction1_0).concat(_descriptor_1.toValue(price1_0).concat(_descriptor_1.toValue(amount1_0).concat(_descriptor_0.toValue(nonce1_0).concat(_descriptor_0.toValue(pair2_0).concat(_descriptor_0.toValue(direction2_0).concat(_descriptor_1.toValue(price2_0).concat(_descriptor_1.toValue(amount2_0).concat(_descriptor_0.toValue(nonce2_0).concat(_descriptor_0.toValue(pair3_0).concat(_descriptor_0.toValue(direction3_0).concat(_descriptor_1.toValue(price3_0).concat(_descriptor_1.toValue(amount3_0).concat(_descriptor_0.toValue(nonce3_0).concat(_descriptor_0.toValue(pair4_0).concat(_descriptor_0.toValue(direction4_0).concat(_descriptor_1.toValue(price4_0).concat(_descriptor_1.toValue(amount4_0).concat(_descriptor_0.toValue(nonce4_0)))))))))))))))))))),
            alignment: _descriptor_0.alignment().concat(_descriptor_0.alignment().concat(_descriptor_1.alignment().concat(_descriptor_1.alignment().concat(_descriptor_0.alignment().concat(_descriptor_0.alignment().concat(_descriptor_0.alignment().concat(_descriptor_1.alignment().concat(_descriptor_1.alignment().concat(_descriptor_0.alignment().concat(_descriptor_0.alignment().concat(_descriptor_0.alignment().concat(_descriptor_1.alignment().concat(_descriptor_1.alignment().concat(_descriptor_0.alignment().concat(_descriptor_0.alignment().concat(_descriptor_0.alignment().concat(_descriptor_1.alignment().concat(_descriptor_1.alignment().concat(_descriptor_0.alignment())))))))))))))))))))
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = this._batchCreateOrders4_0(context,
                                                    partialProofData,
                                                    pair1_0,
                                                    direction1_0,
                                                    price1_0,
                                                    amount1_0,
                                                    nonce1_0,
                                                    pair2_0,
                                                    direction2_0,
                                                    price2_0,
                                                    amount2_0,
                                                    nonce2_0,
                                                    pair3_0,
                                                    direction3_0,
                                                    price3_0,
                                                    amount3_0,
                                                    nonce3_0,
                                                    pair4_0,
                                                    direction4_0,
                                                    price4_0,
                                                    amount4_0,
                                                    nonce4_0);
        partialProofData.output = { value: [], alignment: [] };
        return { result: result_0, context: context, proofData: partialProofData, gasCost: context.gasCost };
      },
      cancelOrder: (...args_1) => {
        if (args_1.length !== 8) {
          throw new __compactRuntime.CompactError(`cancelOrder: expected 8 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const orderId_0 = args_1[1];
        const pair_0 = args_1[2];
        const direction_0 = args_1[3];
        const price_0 = args_1[4];
        const amount_0 = args_1[5];
        const nonce_0 = args_1[6];
        const refundNonce_0 = args_1[7];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.currentQueryContext != undefined)) {
          __compactRuntime.typeError('cancelOrder',
                                     'argument 1 (as invoked from Typescript)',
                                     'InnermostFX.compact line 312 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(orderId_0.buffer instanceof ArrayBuffer && orderId_0.BYTES_PER_ELEMENT === 1 && orderId_0.length === 32)) {
          __compactRuntime.typeError('cancelOrder',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'InnermostFX.compact line 312 char 1',
                                     'Bytes<32>',
                                     orderId_0)
        }
        if (!(pair_0.buffer instanceof ArrayBuffer && pair_0.BYTES_PER_ELEMENT === 1 && pair_0.length === 32)) {
          __compactRuntime.typeError('cancelOrder',
                                     'argument 2 (argument 3 as invoked from Typescript)',
                                     'InnermostFX.compact line 312 char 1',
                                     'Bytes<32>',
                                     pair_0)
        }
        if (!(direction_0.buffer instanceof ArrayBuffer && direction_0.BYTES_PER_ELEMENT === 1 && direction_0.length === 32)) {
          __compactRuntime.typeError('cancelOrder',
                                     'argument 3 (argument 4 as invoked from Typescript)',
                                     'InnermostFX.compact line 312 char 1',
                                     'Bytes<32>',
                                     direction_0)
        }
        if (!(typeof(price_0) === 'bigint' && price_0 >= 0n && price_0 <= 18446744073709551615n)) {
          __compactRuntime.typeError('cancelOrder',
                                     'argument 4 (argument 5 as invoked from Typescript)',
                                     'InnermostFX.compact line 312 char 1',
                                     'Uint<0..18446744073709551616>',
                                     price_0)
        }
        if (!(typeof(amount_0) === 'bigint' && amount_0 >= 0n && amount_0 <= 18446744073709551615n)) {
          __compactRuntime.typeError('cancelOrder',
                                     'argument 5 (argument 6 as invoked from Typescript)',
                                     'InnermostFX.compact line 312 char 1',
                                     'Uint<0..18446744073709551616>',
                                     amount_0)
        }
        if (!(nonce_0.buffer instanceof ArrayBuffer && nonce_0.BYTES_PER_ELEMENT === 1 && nonce_0.length === 32)) {
          __compactRuntime.typeError('cancelOrder',
                                     'argument 6 (argument 7 as invoked from Typescript)',
                                     'InnermostFX.compact line 312 char 1',
                                     'Bytes<32>',
                                     nonce_0)
        }
        if (!(refundNonce_0.buffer instanceof ArrayBuffer && refundNonce_0.BYTES_PER_ELEMENT === 1 && refundNonce_0.length === 32)) {
          __compactRuntime.typeError('cancelOrder',
                                     'argument 7 (argument 8 as invoked from Typescript)',
                                     'InnermostFX.compact line 312 char 1',
                                     'Bytes<32>',
                                     refundNonce_0)
        }
        const context = { ...contextOrig_0, gasCost: __compactRuntime.emptyRunningCost() };
        const partialProofData = {
          input: {
            value: _descriptor_0.toValue(orderId_0).concat(_descriptor_0.toValue(pair_0).concat(_descriptor_0.toValue(direction_0).concat(_descriptor_1.toValue(price_0).concat(_descriptor_1.toValue(amount_0).concat(_descriptor_0.toValue(nonce_0).concat(_descriptor_0.toValue(refundNonce_0))))))),
            alignment: _descriptor_0.alignment().concat(_descriptor_0.alignment().concat(_descriptor_0.alignment().concat(_descriptor_1.alignment().concat(_descriptor_1.alignment().concat(_descriptor_0.alignment().concat(_descriptor_0.alignment()))))))
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = this._cancelOrder_0(context,
                                             partialProofData,
                                             orderId_0,
                                             pair_0,
                                             direction_0,
                                             price_0,
                                             amount_0,
                                             nonce_0,
                                             refundNonce_0);
        partialProofData.output = { value: [], alignment: [] };
        return { result: result_0, context: context, proofData: partialProofData, gasCost: context.gasCost };
      },
      matchOrders: (...args_1) => {
        if (args_1.length !== 15) {
          throw new __compactRuntime.CompactError(`matchOrders: expected 15 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const bidOrderId_0 = args_1[1];
        const askOrderId_0 = args_1[2];
        const matchAmount_0 = args_1[3];
        const bidPair_0 = args_1[4];
        const bidPrice_0 = args_1[5];
        const bidAmount_0 = args_1[6];
        const bidNonce_0 = args_1[7];
        const askPair_0 = args_1[8];
        const askPrice_0 = args_1[9];
        const askAmount_0 = args_1[10];
        const askNonce_0 = args_1[11];
        const bidRemainderNonce_0 = args_1[12];
        const askRemainderNonce_0 = args_1[13];
        const settlementNonce_0 = args_1[14];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.currentQueryContext != undefined)) {
          __compactRuntime.typeError('matchOrders',
                                     'argument 1 (as invoked from Typescript)',
                                     'InnermostFX.compact line 380 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(bidOrderId_0.buffer instanceof ArrayBuffer && bidOrderId_0.BYTES_PER_ELEMENT === 1 && bidOrderId_0.length === 32)) {
          __compactRuntime.typeError('matchOrders',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'InnermostFX.compact line 380 char 1',
                                     'Bytes<32>',
                                     bidOrderId_0)
        }
        if (!(askOrderId_0.buffer instanceof ArrayBuffer && askOrderId_0.BYTES_PER_ELEMENT === 1 && askOrderId_0.length === 32)) {
          __compactRuntime.typeError('matchOrders',
                                     'argument 2 (argument 3 as invoked from Typescript)',
                                     'InnermostFX.compact line 380 char 1',
                                     'Bytes<32>',
                                     askOrderId_0)
        }
        if (!(typeof(matchAmount_0) === 'bigint' && matchAmount_0 >= 0n && matchAmount_0 <= 18446744073709551615n)) {
          __compactRuntime.typeError('matchOrders',
                                     'argument 3 (argument 4 as invoked from Typescript)',
                                     'InnermostFX.compact line 380 char 1',
                                     'Uint<0..18446744073709551616>',
                                     matchAmount_0)
        }
        if (!(bidPair_0.buffer instanceof ArrayBuffer && bidPair_0.BYTES_PER_ELEMENT === 1 && bidPair_0.length === 32)) {
          __compactRuntime.typeError('matchOrders',
                                     'argument 4 (argument 5 as invoked from Typescript)',
                                     'InnermostFX.compact line 380 char 1',
                                     'Bytes<32>',
                                     bidPair_0)
        }
        if (!(typeof(bidPrice_0) === 'bigint' && bidPrice_0 >= 0n && bidPrice_0 <= 18446744073709551615n)) {
          __compactRuntime.typeError('matchOrders',
                                     'argument 5 (argument 6 as invoked from Typescript)',
                                     'InnermostFX.compact line 380 char 1',
                                     'Uint<0..18446744073709551616>',
                                     bidPrice_0)
        }
        if (!(typeof(bidAmount_0) === 'bigint' && bidAmount_0 >= 0n && bidAmount_0 <= 18446744073709551615n)) {
          __compactRuntime.typeError('matchOrders',
                                     'argument 6 (argument 7 as invoked from Typescript)',
                                     'InnermostFX.compact line 380 char 1',
                                     'Uint<0..18446744073709551616>',
                                     bidAmount_0)
        }
        if (!(bidNonce_0.buffer instanceof ArrayBuffer && bidNonce_0.BYTES_PER_ELEMENT === 1 && bidNonce_0.length === 32)) {
          __compactRuntime.typeError('matchOrders',
                                     'argument 7 (argument 8 as invoked from Typescript)',
                                     'InnermostFX.compact line 380 char 1',
                                     'Bytes<32>',
                                     bidNonce_0)
        }
        if (!(askPair_0.buffer instanceof ArrayBuffer && askPair_0.BYTES_PER_ELEMENT === 1 && askPair_0.length === 32)) {
          __compactRuntime.typeError('matchOrders',
                                     'argument 8 (argument 9 as invoked from Typescript)',
                                     'InnermostFX.compact line 380 char 1',
                                     'Bytes<32>',
                                     askPair_0)
        }
        if (!(typeof(askPrice_0) === 'bigint' && askPrice_0 >= 0n && askPrice_0 <= 18446744073709551615n)) {
          __compactRuntime.typeError('matchOrders',
                                     'argument 9 (argument 10 as invoked from Typescript)',
                                     'InnermostFX.compact line 380 char 1',
                                     'Uint<0..18446744073709551616>',
                                     askPrice_0)
        }
        if (!(typeof(askAmount_0) === 'bigint' && askAmount_0 >= 0n && askAmount_0 <= 18446744073709551615n)) {
          __compactRuntime.typeError('matchOrders',
                                     'argument 10 (argument 11 as invoked from Typescript)',
                                     'InnermostFX.compact line 380 char 1',
                                     'Uint<0..18446744073709551616>',
                                     askAmount_0)
        }
        if (!(askNonce_0.buffer instanceof ArrayBuffer && askNonce_0.BYTES_PER_ELEMENT === 1 && askNonce_0.length === 32)) {
          __compactRuntime.typeError('matchOrders',
                                     'argument 11 (argument 12 as invoked from Typescript)',
                                     'InnermostFX.compact line 380 char 1',
                                     'Bytes<32>',
                                     askNonce_0)
        }
        if (!(bidRemainderNonce_0.buffer instanceof ArrayBuffer && bidRemainderNonce_0.BYTES_PER_ELEMENT === 1 && bidRemainderNonce_0.length === 32)) {
          __compactRuntime.typeError('matchOrders',
                                     'argument 12 (argument 13 as invoked from Typescript)',
                                     'InnermostFX.compact line 380 char 1',
                                     'Bytes<32>',
                                     bidRemainderNonce_0)
        }
        if (!(askRemainderNonce_0.buffer instanceof ArrayBuffer && askRemainderNonce_0.BYTES_PER_ELEMENT === 1 && askRemainderNonce_0.length === 32)) {
          __compactRuntime.typeError('matchOrders',
                                     'argument 13 (argument 14 as invoked from Typescript)',
                                     'InnermostFX.compact line 380 char 1',
                                     'Bytes<32>',
                                     askRemainderNonce_0)
        }
        if (!(settlementNonce_0.buffer instanceof ArrayBuffer && settlementNonce_0.BYTES_PER_ELEMENT === 1 && settlementNonce_0.length === 32)) {
          __compactRuntime.typeError('matchOrders',
                                     'argument 14 (argument 15 as invoked from Typescript)',
                                     'InnermostFX.compact line 380 char 1',
                                     'Bytes<32>',
                                     settlementNonce_0)
        }
        const context = { ...contextOrig_0, gasCost: __compactRuntime.emptyRunningCost() };
        const partialProofData = {
          input: {
            value: _descriptor_0.toValue(bidOrderId_0).concat(_descriptor_0.toValue(askOrderId_0).concat(_descriptor_1.toValue(matchAmount_0).concat(_descriptor_0.toValue(bidPair_0).concat(_descriptor_1.toValue(bidPrice_0).concat(_descriptor_1.toValue(bidAmount_0).concat(_descriptor_0.toValue(bidNonce_0).concat(_descriptor_0.toValue(askPair_0).concat(_descriptor_1.toValue(askPrice_0).concat(_descriptor_1.toValue(askAmount_0).concat(_descriptor_0.toValue(askNonce_0).concat(_descriptor_0.toValue(bidRemainderNonce_0).concat(_descriptor_0.toValue(askRemainderNonce_0).concat(_descriptor_0.toValue(settlementNonce_0)))))))))))))),
            alignment: _descriptor_0.alignment().concat(_descriptor_0.alignment().concat(_descriptor_1.alignment().concat(_descriptor_0.alignment().concat(_descriptor_1.alignment().concat(_descriptor_1.alignment().concat(_descriptor_0.alignment().concat(_descriptor_0.alignment().concat(_descriptor_1.alignment().concat(_descriptor_1.alignment().concat(_descriptor_0.alignment().concat(_descriptor_0.alignment().concat(_descriptor_0.alignment().concat(_descriptor_0.alignment())))))))))))))
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = this._matchOrders_0(context,
                                             partialProofData,
                                             bidOrderId_0,
                                             askOrderId_0,
                                             matchAmount_0,
                                             bidPair_0,
                                             bidPrice_0,
                                             bidAmount_0,
                                             bidNonce_0,
                                             askPair_0,
                                             askPrice_0,
                                             askAmount_0,
                                             askNonce_0,
                                             bidRemainderNonce_0,
                                             askRemainderNonce_0,
                                             settlementNonce_0);
        partialProofData.output = { value: [], alignment: [] };
        return { result: result_0, context: context, proofData: partialProofData, gasCost: context.gasCost };
      }
    };
    this.impureCircuits = {
      mintUSD: this.circuits.mintUSD,
      mintEUR: this.circuits.mintEUR,
      mintJPY: this.circuits.mintJPY,
      createOrder: this.circuits.createOrder,
      batchCreateOrders2: this.circuits.batchCreateOrders2,
      batchCreateOrders4: this.circuits.batchCreateOrders4,
      cancelOrder: this.circuits.cancelOrder,
      matchOrders: this.circuits.matchOrders
    };
    this.provableCircuits = {
      mintUSD: this.circuits.mintUSD,
      mintEUR: this.circuits.mintEUR,
      mintJPY: this.circuits.mintJPY,
      createOrder: this.circuits.createOrder,
      batchCreateOrders2: this.circuits.batchCreateOrders2,
      batchCreateOrders4: this.circuits.batchCreateOrders4,
      cancelOrder: this.circuits.cancelOrder,
      matchOrders: this.circuits.matchOrders
    };
  }
  initialState(...args_0) {
    if (args_0.length !== 1) {
      throw new __compactRuntime.CompactError(`Contract state constructor: expected 1 argument (as invoked from Typescript), received ${args_0.length}`);
    }
    const constructorContext_0 = args_0[0];
    if (typeof(constructorContext_0) !== 'object') {
      throw new __compactRuntime.CompactError(`Contract state constructor: expected 'constructorContext' in argument 1 (as invoked from Typescript) to be an object`);
    }
    if (!('initialPrivateState' in constructorContext_0)) {
      throw new __compactRuntime.CompactError(`Contract state constructor: expected 'initialPrivateState' in argument 1 (as invoked from Typescript)`);
    }
    if (!('initialZswapLocalState' in constructorContext_0)) {
      throw new __compactRuntime.CompactError(`Contract state constructor: expected 'initialZswapLocalState' in argument 1 (as invoked from Typescript)`);
    }
    if (typeof(constructorContext_0.initialZswapLocalState) !== 'object') {
      throw new __compactRuntime.CompactError(`Contract state constructor: expected 'initialZswapLocalState' in argument 1 (as invoked from Typescript) to be an object`);
    }
    const state_0 = new __compactRuntime.ContractState();
    let stateValue_0 = __compactRuntime.StateValue.newArray();
    stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
    state_0.data = new __compactRuntime.ChargedState(stateValue_0);
    state_0.setOperation('mintUSD', new __compactRuntime.ContractOperation());
    state_0.setOperation('mintEUR', new __compactRuntime.ContractOperation());
    state_0.setOperation('mintJPY', new __compactRuntime.ContractOperation());
    state_0.setOperation('createOrder', new __compactRuntime.ContractOperation());
    state_0.setOperation('batchCreateOrders2', new __compactRuntime.ContractOperation());
    state_0.setOperation('batchCreateOrders4', new __compactRuntime.ContractOperation());
    state_0.setOperation('cancelOrder', new __compactRuntime.ContractOperation());
    state_0.setOperation('matchOrders', new __compactRuntime.ContractOperation());
    const context = __compactRuntime.createCircuitContext(__compactRuntime.dummyContractAddress(), constructorContext_0.initialZswapLocalState.coinPublicKey, state_0.data, constructorContext_0.initialPrivateState);
    const partialProofData = {
      input: { value: [], alignment: [] },
      output: undefined,
      publicTranscript: [],
      privateTranscriptOutputs: []
    };
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_13.toValue(0n),
                                                                                              alignment: _descriptor_13.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(0n),
                                                                                              alignment: _descriptor_1.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_13.toValue(1n),
                                                                                              alignment: _descriptor_13.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(0n),
                                                                                              alignment: _descriptor_1.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_13.toValue(2n),
                                                                                              alignment: _descriptor_13.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newMap(
                                                          new __compactRuntime.StateMap()
                                                        ).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_13.toValue(3n),
                                                                                              alignment: _descriptor_13.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newMap(
                                                          new __compactRuntime.StateMap()
                                                        ).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_13.toValue(4n),
                                                                                              alignment: _descriptor_13.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(new Uint8Array(32)),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    const sk_0 = this._localSk_0(context, partialProofData);
    const tmp_0 = this._getDappPubKey_0(sk_0);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_13.toValue(4n),
                                                                                              alignment: _descriptor_13.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(tmp_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    const tmp_1 = 1n;
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_13.toValue(0n),
                                                                                              alignment: _descriptor_13.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(tmp_1),
                                                                                              alignment: _descriptor_1.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    const tmp_2 = 1n;
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_13.toValue(1n),
                                                                                              alignment: _descriptor_13.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(tmp_2),
                                                                                              alignment: _descriptor_1.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    state_0.data = new __compactRuntime.ChargedState(context.currentQueryContext.state.state);
    return {
      currentContractState: state_0,
      currentPrivateState: context.currentPrivateState,
      currentZswapLocalState: context.currentZswapLocalState
    }
  }
  _left_0(value_0) {
    return { is_left: true, left: value_0, right: { bytes: new Uint8Array(32) } };
  }
  _right_0(value_0) {
    return { is_left: false, left: { bytes: new Uint8Array(32) }, right: value_0 };
  }
  _tokenType_0(domain_sep_0, contractAddress_0) {
    return this._persistentCommit_0([domain_sep_0, contractAddress_0.bytes],
                                    new Uint8Array([109, 105, 100, 110, 105, 103, 104, 116, 58, 100, 101, 114, 105, 118, 101, 95, 116, 111, 107, 101, 110, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]));
  }
  _mintShieldedToken_0(context,
                       partialProofData,
                       domain_sep_0,
                       value_0,
                       nonce_0,
                       recipient_0)
  {
    const coin_0 = { nonce: nonce_0,
                     color:
                       this._tokenType_0(domain_sep_0,
                                         _descriptor_4.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                                   partialProofData,
                                                                                                   [
                                                                                                    { dup: { n: 2 } },
                                                                                                    { idx: { cached: true,
                                                                                                             pushPath: false,
                                                                                                             path: [
                                                                                                                    { tag: 'value',
                                                                                                                      value: { value: _descriptor_13.toValue(0n),
                                                                                                                               alignment: _descriptor_13.alignment() } }] } },
                                                                                                    { popeq: { cached: true,
                                                                                                               result: undefined } }]).value)),
                     value: value_0 };
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { swap: { n: 0 } },
                                       { idx: { cached: true,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_13.toValue(4n),
                                                                  alignment: _descriptor_13.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(domain_sep_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { dup: { n: 1 } },
                                       { dup: { n: 1 } },
                                       'member',
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(value_0),
                                                                                              alignment: _descriptor_1.alignment() }).encode() } },
                                       { swap: { n: 0 } },
                                       'neg',
                                       { branch: { skip: 4 } },
                                       { dup: { n: 2 } },
                                       { dup: { n: 2 } },
                                       { idx: { cached: true,
                                                pushPath: false,
                                                path: [ { tag: 'stack' }] } },
                                       'add',
                                       { ins: { cached: true, n: 2 } },
                                       { swap: { n: 0 } }]);
    this._createZswapOutput_0(context, partialProofData, coin_0, recipient_0);
    const cm_0 = this._coinCommitment_0(coin_0, recipient_0);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { swap: { n: 0 } },
                                       { idx: { cached: true,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_13.toValue(2n),
                                                                  alignment: _descriptor_13.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(cm_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newNull().encode() } },
                                       { ins: { cached: true, n: 2 } },
                                       { swap: { n: 0 } }]);
    if (!recipient_0.is_left
        &&
        this._equal_0(recipient_0.right.bytes,
                      _descriptor_4.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                partialProofData,
                                                                                [
                                                                                 { dup: { n: 2 } },
                                                                                 { idx: { cached: true,
                                                                                          pushPath: false,
                                                                                          path: [
                                                                                                 { tag: 'value',
                                                                                                   value: { value: _descriptor_13.toValue(0n),
                                                                                                            alignment: _descriptor_13.alignment() } }] } },
                                                                                 { popeq: { cached: true,
                                                                                            result: undefined } }]).value).bytes))
    {
      __compactRuntime.queryLedgerState(context,
                                        partialProofData,
                                        [
                                         { swap: { n: 0 } },
                                         { idx: { cached: true,
                                                  pushPath: true,
                                                  path: [
                                                         { tag: 'value',
                                                           value: { value: _descriptor_13.toValue(1n),
                                                                    alignment: _descriptor_13.alignment() } }] } },
                                         { push: { storage: false,
                                                   value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(cm_0),
                                                                                                alignment: _descriptor_0.alignment() }).encode() } },
                                         { push: { storage: false,
                                                   value: __compactRuntime.StateValue.newNull().encode() } },
                                         { ins: { cached: true, n: 2 } },
                                         { swap: { n: 0 } }]);
    }
    return coin_0;
  }
  _receiveShielded_0(context, partialProofData, coin_0) {
    const recipient_0 = this._right_0(_descriptor_4.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                                partialProofData,
                                                                                                [
                                                                                                 { dup: { n: 2 } },
                                                                                                 { idx: { cached: true,
                                                                                                          pushPath: false,
                                                                                                          path: [
                                                                                                                 { tag: 'value',
                                                                                                                   value: { value: _descriptor_13.toValue(0n),
                                                                                                                            alignment: _descriptor_13.alignment() } }] } },
                                                                                                 { popeq: { cached: true,
                                                                                                            result: undefined } }]).value));
    this._createZswapOutput_0(context, partialProofData, coin_0, recipient_0);
    const tmp_0 = this._coinCommitment_0(coin_0, recipient_0);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { swap: { n: 0 } },
                                       { idx: { cached: true,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_13.toValue(1n),
                                                                  alignment: _descriptor_13.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(tmp_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newNull().encode() } },
                                       { ins: { cached: true, n: 2 } },
                                       { swap: { n: 0 } }]);
    return [];
  }
  _coinCommitment_0(coin_0, recipient_0) {
    return this._persistentHash_2({ domain_sep:
                                      new Uint8Array([109, 105, 100, 110, 105, 103, 104, 116, 58, 122, 115, 119, 97, 112, 45, 99, 99, 91, 118, 49, 93]),
                                    info: coin_0,
                                    dataType: recipient_0.is_left,
                                    data:
                                      recipient_0.is_left ?
                                      recipient_0.left.bytes :
                                      recipient_0.right.bytes });
  }
  _persistentHash_0(value_0) {
    const result_0 = __compactRuntime.persistentHash(_descriptor_11, value_0);
    return result_0;
  }
  _persistentHash_1(value_0) {
    const result_0 = __compactRuntime.persistentHash(_descriptor_6, value_0);
    return result_0;
  }
  _persistentHash_2(value_0) {
    const result_0 = __compactRuntime.persistentHash(_descriptor_10, value_0);
    return result_0;
  }
  _persistentCommit_0(value_0, rand_0) {
    const result_0 = __compactRuntime.persistentCommit(_descriptor_6,
                                                       value_0,
                                                       rand_0);
    return result_0;
  }
  _createZswapOutput_0(context, partialProofData, coin_0, recipient_0) {
    const result_0 = __compactRuntime.createZswapOutput(context,
                                                        coin_0,
                                                        recipient_0);
    partialProofData.privateTranscriptOutputs.push({
      value: [],
      alignment: []
    });
    return result_0;
  }
  _tokenUSD_0() {
    return new Uint8Array([73, 110, 110, 101, 114, 109, 111, 115, 116, 58, 85, 83, 68, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  }
  _tokenEUR_0() {
    return new Uint8Array([73, 110, 110, 101, 114, 109, 111, 115, 116, 58, 69, 85, 82, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  }
  _tokenJPY_0() {
    return new Uint8Array([73, 110, 110, 101, 114, 109, 111, 115, 116, 58, 74, 80, 89, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  }
  _tokenColorUSD_0(context, partialProofData) {
    return this._tokenType_0(new Uint8Array([73, 110, 110, 101, 114, 109, 111, 115, 116, 58, 85, 83, 68, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
                             _descriptor_4.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                       partialProofData,
                                                                                       [
                                                                                        { dup: { n: 2 } },
                                                                                        { idx: { cached: true,
                                                                                                 pushPath: false,
                                                                                                 path: [
                                                                                                        { tag: 'value',
                                                                                                          value: { value: _descriptor_13.toValue(0n),
                                                                                                                   alignment: _descriptor_13.alignment() } }] } },
                                                                                        { popeq: { cached: true,
                                                                                                   result: undefined } }]).value));
  }
  _tokenColorEUR_0(context, partialProofData) {
    return this._tokenType_0(new Uint8Array([73, 110, 110, 101, 114, 109, 111, 115, 116, 58, 69, 85, 82, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
                             _descriptor_4.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                       partialProofData,
                                                                                       [
                                                                                        { dup: { n: 2 } },
                                                                                        { idx: { cached: true,
                                                                                                 pushPath: false,
                                                                                                 path: [
                                                                                                        { tag: 'value',
                                                                                                          value: { value: _descriptor_13.toValue(0n),
                                                                                                                   alignment: _descriptor_13.alignment() } }] } },
                                                                                        { popeq: { cached: true,
                                                                                                   result: undefined } }]).value));
  }
  _tokenColorJPY_0(context, partialProofData) {
    return this._tokenType_0(new Uint8Array([73, 110, 110, 101, 114, 109, 111, 115, 116, 58, 74, 80, 89, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
                             _descriptor_4.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                       partialProofData,
                                                                                       [
                                                                                        { dup: { n: 2 } },
                                                                                        { idx: { cached: true,
                                                                                                 pushPath: false,
                                                                                                 path: [
                                                                                                        { tag: 'value',
                                                                                                          value: { value: _descriptor_13.toValue(0n),
                                                                                                                   alignment: _descriptor_13.alignment() } }] } },
                                                                                        { popeq: { cached: true,
                                                                                                   result: undefined } }]).value));
  }
  _dirBid_0() {
    return new Uint8Array([98, 105, 100, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  }
  _dirAsk_0() {
    return new Uint8Array([97, 115, 107, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  }
  _pairUSDEUR_0() {
    return new Uint8Array([112, 97, 105, 114, 58, 85, 83, 68, 47, 69, 85, 82, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  }
  _pairUSDJPY_0() {
    return new Uint8Array([112, 97, 105, 114, 58, 85, 83, 68, 47, 74, 80, 89, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  }
  _pairEURJPY_0() {
    return new Uint8Array([112, 97, 105, 114, 58, 69, 85, 82, 47, 74, 80, 89, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  }
  _SCALE_0() { return 1000000n; }
  _localSk_0(context, partialProofData) {
    const witnessContext_0 = __compactRuntime.createWitnessContext(ledger(context.currentQueryContext.state), context.currentPrivateState, context.currentQueryContext.address);
    const [nextPrivateState_0, result_0] = this.witnesses.localSk(witnessContext_0);
    context.currentPrivateState = nextPrivateState_0;
    if (!(result_0.buffer instanceof ArrayBuffer && result_0.BYTES_PER_ELEMENT === 1 && result_0.length === 32)) {
      __compactRuntime.typeError('localSk',
                                 'return value',
                                 'InnermostFX.compact line 75 char 1',
                                 'Bytes<32>',
                                 result_0)
    }
    partialProofData.privateTranscriptOutputs.push({
      value: _descriptor_0.toValue(result_0),
      alignment: _descriptor_0.alignment()
    });
    return result_0;
  }
  _askSk_0(context, partialProofData) {
    const witnessContext_0 = __compactRuntime.createWitnessContext(ledger(context.currentQueryContext.state), context.currentPrivateState, context.currentQueryContext.address);
    const [nextPrivateState_0, result_0] = this.witnesses.askSk(witnessContext_0);
    context.currentPrivateState = nextPrivateState_0;
    if (!(result_0.buffer instanceof ArrayBuffer && result_0.BYTES_PER_ELEMENT === 1 && result_0.length === 32)) {
      __compactRuntime.typeError('askSk',
                                 'return value',
                                 'InnermostFX.compact line 78 char 1',
                                 'Bytes<32>',
                                 result_0)
    }
    partialProofData.privateTranscriptOutputs.push({
      value: _descriptor_0.toValue(result_0),
      alignment: _descriptor_0.alignment()
    });
    return result_0;
  }
  _witDivide_0(context, partialProofData, numerator_0, denominator_0) {
    const witnessContext_0 = __compactRuntime.createWitnessContext(ledger(context.currentQueryContext.state), context.currentPrivateState, context.currentQueryContext.address);
    const [nextPrivateState_0, result_0] = this.witnesses.witDivide(witnessContext_0,
                                                                    numerator_0,
                                                                    denominator_0);
    context.currentPrivateState = nextPrivateState_0;
    if (!(typeof(result_0) === 'bigint' && result_0 >= 0n && result_0 <= 340282366920938463463374607431768211455n)) {
      __compactRuntime.typeError('witDivide',
                                 'return value',
                                 'InnermostFX.compact line 81 char 1',
                                 'Uint<0..340282366920938463463374607431768211456>',
                                 result_0)
    }
    partialProofData.privateTranscriptOutputs.push({
      value: _descriptor_7.toValue(result_0),
      alignment: _descriptor_7.alignment()
    });
    return result_0;
  }
  _getDappPubKey_0(sk_0) {
    return this._persistentHash_1([new Uint8Array([73, 110, 110, 101, 114, 109, 111, 115, 116, 58, 112, 107, 58, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
                                   sk_0]);
  }
  _quoteCost_0(context, partialProofData, baseAmount_0, price_0) {
    return this._witDivide_0(context,
                             partialProofData,
                             baseAmount_0 * price_0,
                             this._SCALE_0());
  }
  _makeCommitment_0(pair_0, direction_0, price_0, amount_0, ownerPk_0, nonce_0)
  {
    return this._persistentHash_0([pair_0,
                                   direction_0,
                                   __compactRuntime.convertFieldToBytes(32,
                                                                        price_0,
                                                                        'InnermostFX.compact line 129 char 9'),
                                   __compactRuntime.convertFieldToBytes(32,
                                                                        amount_0,
                                                                        'InnermostFX.compact line 130 char 9'),
                                   ownerPk_0,
                                   nonce_0]);
  }
  _newOrderId_0(context, partialProofData) {
    const n_0 = _descriptor_1.fromValue(__compactRuntime.queryLedgerState(context,
                                                                          partialProofData,
                                                                          [
                                                                           { dup: { n: 0 } },
                                                                           { idx: { cached: false,
                                                                                    pushPath: false,
                                                                                    path: [
                                                                                           { tag: 'value',
                                                                                             value: { value: _descriptor_13.toValue(0n),
                                                                                                      alignment: _descriptor_13.alignment() } }] } },
                                                                           { popeq: { cached: false,
                                                                                      result: undefined } }]).value);
    const tmp_0 = ((t1) => {
                    if (t1 > 18446744073709551615n) {
                      throw new __compactRuntime.CompactError('InnermostFX.compact line 139 char 19: cast from Field or Uint value to smaller Uint value failed: ' + t1 + ' is greater than 18446744073709551615');
                    }
                    return t1;
                  })(n_0 + 1n);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_13.toValue(0n),
                                                                                              alignment: _descriptor_13.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(tmp_0),
                                                                                              alignment: _descriptor_1.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    return this._persistentHash_1([new Uint8Array([111, 114, 100, 101, 114, 73, 100, 58, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
                                   __compactRuntime.convertFieldToBytes(32,
                                                                        n_0,
                                                                        'InnermostFX.compact line 142 char 9')]);
  }
  _newTradeId_0(context, partialProofData) {
    const n_0 = _descriptor_1.fromValue(__compactRuntime.queryLedgerState(context,
                                                                          partialProofData,
                                                                          [
                                                                           { dup: { n: 0 } },
                                                                           { idx: { cached: false,
                                                                                    pushPath: false,
                                                                                    path: [
                                                                                           { tag: 'value',
                                                                                             value: { value: _descriptor_13.toValue(1n),
                                                                                                      alignment: _descriptor_13.alignment() } }] } },
                                                                           { popeq: { cached: false,
                                                                                      result: undefined } }]).value);
    const tmp_0 = ((t1) => {
                    if (t1 > 18446744073709551615n) {
                      throw new __compactRuntime.CompactError('InnermostFX.compact line 149 char 19: cast from Field or Uint value to smaller Uint value failed: ' + t1 + ' is greater than 18446744073709551615');
                    }
                    return t1;
                  })(n_0 + 1n);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_13.toValue(1n),
                                                                                              alignment: _descriptor_13.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(tmp_0),
                                                                                              alignment: _descriptor_1.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    return this._persistentHash_1([new Uint8Array([116, 114, 97, 100, 101, 73, 100, 58, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
                                   __compactRuntime.convertFieldToBytes(32,
                                                                        n_0,
                                                                        'InnermostFX.compact line 152 char 9')]);
  }
  _pairTokens_0(context, partialProofData, pair_0) {
    if (this._equal_1(pair_0, this._pairUSDEUR_0())) {
      return [this._tokenColorUSD_0(context, partialProofData),
              this._tokenColorEUR_0(context, partialProofData)];
    } else {
      if (this._equal_2(pair_0, this._pairUSDJPY_0())) {
        return [this._tokenColorUSD_0(context, partialProofData),
                this._tokenColorJPY_0(context, partialProofData)];
      } else {
        return [this._tokenColorEUR_0(context, partialProofData),
                this._tokenColorJPY_0(context, partialProofData)];
      }
    }
  }
  _assertLive_0(context, partialProofData, orderId_0) {
    __compactRuntime.assert(!_descriptor_2.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                       partialProofData,
                                                                                       [
                                                                                        { dup: { n: 0 } },
                                                                                        { idx: { cached: false,
                                                                                                 pushPath: false,
                                                                                                 path: [
                                                                                                        { tag: 'value',
                                                                                                          value: { value: _descriptor_13.toValue(3n),
                                                                                                                   alignment: _descriptor_13.alignment() } }] } },
                                                                                        { idx: { cached: false,
                                                                                                 pushPath: false,
                                                                                                 path: [
                                                                                                        { tag: 'value',
                                                                                                          value: { value: _descriptor_0.toValue(orderId_0),
                                                                                                                   alignment: _descriptor_0.alignment() } }] } },
                                                                                        { popeq: { cached: false,
                                                                                                   result: undefined } }]).value),
                            'Order already consumed or cancelled');
    return [];
  }
  _consume_0(context, partialProofData, orderId_0) {
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_13.toValue(3n),
                                                                  alignment: _descriptor_13.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(orderId_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_2.toValue(true),
                                                                                              alignment: _descriptor_2.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    return [];
  }
  _mintUSD_0(context, partialProofData, amount_0, recipient_0, nonce_0) {
    let t_0;
    __compactRuntime.assert((t_0 = amount_0, t_0 > 0n),
                            'Amount must be positive');
    this._mintShieldedToken_0(context,
                              partialProofData,
                              this._tokenUSD_0(),
                              amount_0,
                              nonce_0,
                              recipient_0);
    return [];
  }
  _mintEUR_0(context, partialProofData, amount_0, recipient_0, nonce_0) {
    let t_0;
    __compactRuntime.assert((t_0 = amount_0, t_0 > 0n),
                            'Amount must be positive');
    this._mintShieldedToken_0(context,
                              partialProofData,
                              this._tokenEUR_0(),
                              amount_0,
                              nonce_0,
                              recipient_0);
    return [];
  }
  _mintJPY_0(context, partialProofData, amount_0, recipient_0, nonce_0) {
    let t_0;
    __compactRuntime.assert((t_0 = amount_0, t_0 > 0n),
                            'Amount must be positive');
    this._mintShieldedToken_0(context,
                              partialProofData,
                              this._tokenJPY_0(),
                              amount_0,
                              nonce_0,
                              recipient_0);
    return [];
  }
  _createOrderInternal_0(context,
                         partialProofData,
                         pair_0,
                         direction_0,
                         price_0,
                         amount_0,
                         nonce_0,
                         callerPk_0)
  {
    __compactRuntime.assert(price_0 > 0n, 'Price must be positive');
    __compactRuntime.assert(amount_0 > 0n, 'Amount must be positive');
    __compactRuntime.assert(this._equal_3(direction_0, this._dirBid_0())
                            ||
                            this._equal_4(direction_0, this._dirAsk_0()),
                            'Direction must be bid or ask');
    __compactRuntime.assert(this._equal_5(pair_0, this._pairUSDEUR_0())
                            ||
                            this._equal_6(pair_0, this._pairUSDJPY_0())
                            ||
                            this._equal_7(pair_0, this._pairEURJPY_0()),
                            'Unsupported currency pair');
    const tokens_0 = this._pairTokens_0(context, partialProofData, pair_0);
    const baseToken_0 = tokens_0[0];
    const quoteToken_0 = tokens_0[1];
    const lockToken_0 = this._equal_8(direction_0, this._dirBid_0()) ?
                        quoteToken_0 :
                        baseToken_0;
    const lockAmount_0 = this._equal_9(direction_0, this._dirBid_0()) ?
                         this._quoteCost_0(context,
                                           partialProofData,
                                           amount_0,
                                           price_0)
                         :
                         amount_0;
    this._receiveShielded_0(context,
                            partialProofData,
                            { nonce: nonce_0,
                              color: lockToken_0,
                              value:
                                ((t1) => {
                                  if (t1 > 18446744073709551615n) {
                                    throw new __compactRuntime.CompactError('InnermostFX.compact line 256 char 18: cast from Field or Uint value to smaller Uint value failed: ' + t1 + ' is greater than 18446744073709551615');
                                  }
                                  return t1;
                                })(lockAmount_0) });
    const orderId_0 = this._newOrderId_0(context, partialProofData);
    const commitment_0 = this._makeCommitment_0(pair_0,
                                                direction_0,
                                                price_0,
                                                amount_0,
                                                callerPk_0,
                                                nonce_0);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_13.toValue(2n),
                                                                  alignment: _descriptor_13.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(orderId_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(commitment_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    return [];
  }
  _createOrder_0(context,
                 partialProofData,
                 pair_0,
                 direction_0,
                 price_0,
                 amount_0,
                 nonce_0)
  {
    const callerPk_0 = this._getDappPubKey_0(this._localSk_0(context,
                                                             partialProofData));
    this._createOrderInternal_0(context,
                                partialProofData,
                                pair_0,
                                direction_0,
                                price_0,
                                amount_0,
                                nonce_0,
                                callerPk_0);
    return [];
  }
  _batchCreateOrders2_0(context,
                        partialProofData,
                        pair1_0,
                        direction1_0,
                        price1_0,
                        amount1_0,
                        nonce1_0,
                        pair2_0,
                        direction2_0,
                        price2_0,
                        amount2_0,
                        nonce2_0)
  {
    const callerPk_0 = this._getDappPubKey_0(this._localSk_0(context,
                                                             partialProofData));
    this._createOrderInternal_0(context,
                                partialProofData,
                                pair1_0,
                                direction1_0,
                                price1_0,
                                amount1_0,
                                nonce1_0,
                                callerPk_0);
    this._createOrderInternal_0(context,
                                partialProofData,
                                pair2_0,
                                direction2_0,
                                price2_0,
                                amount2_0,
                                nonce2_0,
                                callerPk_0);
    return [];
  }
  _batchCreateOrders4_0(context,
                        partialProofData,
                        pair1_0,
                        direction1_0,
                        price1_0,
                        amount1_0,
                        nonce1_0,
                        pair2_0,
                        direction2_0,
                        price2_0,
                        amount2_0,
                        nonce2_0,
                        pair3_0,
                        direction3_0,
                        price3_0,
                        amount3_0,
                        nonce3_0,
                        pair4_0,
                        direction4_0,
                        price4_0,
                        amount4_0,
                        nonce4_0)
  {
    const callerPk_0 = this._getDappPubKey_0(this._localSk_0(context,
                                                             partialProofData));
    this._createOrderInternal_0(context,
                                partialProofData,
                                pair1_0,
                                direction1_0,
                                price1_0,
                                amount1_0,
                                nonce1_0,
                                callerPk_0);
    this._createOrderInternal_0(context,
                                partialProofData,
                                pair2_0,
                                direction2_0,
                                price2_0,
                                amount2_0,
                                nonce2_0,
                                callerPk_0);
    this._createOrderInternal_0(context,
                                partialProofData,
                                pair3_0,
                                direction3_0,
                                price3_0,
                                amount3_0,
                                nonce3_0,
                                callerPk_0);
    this._createOrderInternal_0(context,
                                partialProofData,
                                pair4_0,
                                direction4_0,
                                price4_0,
                                amount4_0,
                                nonce4_0,
                                callerPk_0);
    return [];
  }
  _cancelOrder_0(context,
                 partialProofData,
                 orderId_0,
                 pair_0,
                 direction_0,
                 price_0,
                 amount_0,
                 nonce_0,
                 refundNonce_0)
  {
    this._assertLive_0(context, partialProofData, orderId_0);
    const callerPk_0 = this._getDappPubKey_0(this._localSk_0(context,
                                                             partialProofData));
    const expectedCommitment_0 = this._makeCommitment_0(pair_0,
                                                        direction_0,
                                                        price_0,
                                                        amount_0,
                                                        callerPk_0,
                                                        nonce_0);
    const storedCommitment_0 = _descriptor_0.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                         partialProofData,
                                                                                         [
                                                                                          { dup: { n: 0 } },
                                                                                          { idx: { cached: false,
                                                                                                   pushPath: false,
                                                                                                   path: [
                                                                                                          { tag: 'value',
                                                                                                            value: { value: _descriptor_13.toValue(2n),
                                                                                                                     alignment: _descriptor_13.alignment() } }] } },
                                                                                          { idx: { cached: false,
                                                                                                   pushPath: false,
                                                                                                   path: [
                                                                                                          { tag: 'value',
                                                                                                            value: { value: _descriptor_0.toValue(orderId_0),
                                                                                                                     alignment: _descriptor_0.alignment() } }] } },
                                                                                          { popeq: { cached: false,
                                                                                                     result: undefined } }]).value);
    __compactRuntime.assert(this._equal_10(expectedCommitment_0,
                                           storedCommitment_0),
                            'Not your order');
    this._consume_0(context, partialProofData, orderId_0);
    const tokens_0 = this._pairTokens_0(context, partialProofData, pair_0);
    const baseToken_0 = tokens_0[0];
    const quoteToken_0 = tokens_0[1];
    const refundToken_0 = this._equal_11(direction_0, this._dirBid_0()) ?
                          quoteToken_0 :
                          baseToken_0;
    const refundAmount_0 = this._equal_12(direction_0, this._dirBid_0()) ?
                           this._quoteCost_0(context,
                                             partialProofData,
                                             amount_0,
                                             price_0)
                           :
                           amount_0;
    this._mintShieldedToken_0(context,
                              partialProofData,
                              refundToken_0,
                              ((t1) => {
                                if (t1 > 18446744073709551615n) {
                                  throw new __compactRuntime.CompactError('InnermostFX.compact line 343 char 18: cast from Field or Uint value to smaller Uint value failed: ' + t1 + ' is greater than 18446744073709551615');
                                }
                                return t1;
                              })(refundAmount_0),
                              refundNonce_0,
                              this._left_0({ bytes: callerPk_0 }));
    return [];
  }
  _matchOrders_0(context,
                 partialProofData,
                 bidOrderId_0,
                 askOrderId_0,
                 matchAmount_0,
                 bidPair_0,
                 bidPrice_0,
                 bidAmount_0,
                 bidNonce_0,
                 askPair_0,
                 askPrice_0,
                 askAmount_0,
                 askNonce_0,
                 bidRemainderNonce_0,
                 askRemainderNonce_0,
                 settlementNonce_0)
  {
    this._assertLive_0(context, partialProofData, bidOrderId_0);
    this._assertLive_0(context, partialProofData, askOrderId_0);
    const bidPk_0 = this._getDappPubKey_0(this._localSk_0(context,
                                                          partialProofData));
    const bidComputed_0 = this._makeCommitment_0(bidPair_0,
                                                 this._dirBid_0(),
                                                 bidPrice_0,
                                                 bidAmount_0,
                                                 bidPk_0,
                                                 bidNonce_0);
    __compactRuntime.assert(this._equal_13(bidComputed_0,
                                           _descriptor_0.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                                     partialProofData,
                                                                                                     [
                                                                                                      { dup: { n: 0 } },
                                                                                                      { idx: { cached: false,
                                                                                                               pushPath: false,
                                                                                                               path: [
                                                                                                                      { tag: 'value',
                                                                                                                        value: { value: _descriptor_13.toValue(2n),
                                                                                                                                 alignment: _descriptor_13.alignment() } }] } },
                                                                                                      { idx: { cached: false,
                                                                                                               pushPath: false,
                                                                                                               path: [
                                                                                                                      { tag: 'value',
                                                                                                                        value: { value: _descriptor_0.toValue(bidOrderId_0),
                                                                                                                                 alignment: _descriptor_0.alignment() } }] } },
                                                                                                      { popeq: { cached: false,
                                                                                                                 result: undefined } }]).value)),
                            'Bid ownership failed');
    const askPk_0 = this._getDappPubKey_0(this._askSk_0(context,
                                                        partialProofData));
    const askComputed_0 = this._makeCommitment_0(askPair_0,
                                                 this._dirAsk_0(),
                                                 askPrice_0,
                                                 askAmount_0,
                                                 askPk_0,
                                                 askNonce_0);
    __compactRuntime.assert(this._equal_14(askComputed_0,
                                           _descriptor_0.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                                     partialProofData,
                                                                                                     [
                                                                                                      { dup: { n: 0 } },
                                                                                                      { idx: { cached: false,
                                                                                                               pushPath: false,
                                                                                                               path: [
                                                                                                                      { tag: 'value',
                                                                                                                        value: { value: _descriptor_13.toValue(2n),
                                                                                                                                 alignment: _descriptor_13.alignment() } }] } },
                                                                                                      { idx: { cached: false,
                                                                                                               pushPath: false,
                                                                                                               path: [
                                                                                                                      { tag: 'value',
                                                                                                                        value: { value: _descriptor_0.toValue(askOrderId_0),
                                                                                                                                 alignment: _descriptor_0.alignment() } }] } },
                                                                                                      { popeq: { cached: false,
                                                                                                                 result: undefined } }]).value)),
                            'Ask ownership failed');
    __compactRuntime.assert(this._equal_15(bidPair_0, askPair_0),
                            'Currency pair mismatch');
    __compactRuntime.assert(bidPrice_0 >= askPrice_0, 'Orders do not cross');
    __compactRuntime.assert(matchAmount_0 > 0n, 'Match amount must be positive');
    __compactRuntime.assert(matchAmount_0 <= bidAmount_0,
                            'Match amount exceeds bid');
    __compactRuntime.assert(matchAmount_0 <= askAmount_0,
                            'Match amount exceeds ask');
    this._consume_0(context, partialProofData, bidOrderId_0);
    this._consume_0(context, partialProofData, askOrderId_0);
    const bidRemaining_0 = (__compactRuntime.assert(bidAmount_0 >= matchAmount_0,
                                                    'result of subtraction would be negative'),
                            bidAmount_0 - matchAmount_0);
    const askRemaining_0 = (__compactRuntime.assert(askAmount_0 >= matchAmount_0,
                                                    'result of subtraction would be negative'),
                            askAmount_0 - matchAmount_0);
    const tokens_0 = this._pairTokens_0(context, partialProofData, bidPair_0);
    const baseToken_0 = tokens_0[0];
    const quoteToken_0 = tokens_0[1];
    let t_0;
    if (t_0 = bidRemaining_0, t_0 > 0n) {
      const newBidId_0 = this._newOrderId_0(context, partialProofData);
      const newBidCmt_0 = this._makeCommitment_0(bidPair_0,
                                                 this._dirBid_0(),
                                                 bidPrice_0,
                                                 bidRemaining_0,
                                                 bidPk_0,
                                                 bidRemainderNonce_0);
      __compactRuntime.queryLedgerState(context,
                                        partialProofData,
                                        [
                                         { idx: { cached: false,
                                                  pushPath: true,
                                                  path: [
                                                         { tag: 'value',
                                                           value: { value: _descriptor_13.toValue(2n),
                                                                    alignment: _descriptor_13.alignment() } }] } },
                                         { push: { storage: false,
                                                   value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(newBidId_0),
                                                                                                alignment: _descriptor_0.alignment() }).encode() } },
                                         { push: { storage: true,
                                                   value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(newBidCmt_0),
                                                                                                alignment: _descriptor_0.alignment() }).encode() } },
                                         { ins: { cached: false, n: 1 } },
                                         { ins: { cached: true, n: 1 } }]);
      const remainderQuoteLock_0 = this._quoteCost_0(context,
                                                     partialProofData,
                                                     bidRemaining_0,
                                                     bidPrice_0);
      this._receiveShielded_0(context,
                              partialProofData,
                              { nonce: bidRemainderNonce_0,
                                color: quoteToken_0,
                                value:
                                  ((t1) => {
                                    if (t1 > 18446744073709551615n) {
                                      throw new __compactRuntime.CompactError('InnermostFX.compact line 444 char 22: cast from Field or Uint value to smaller Uint value failed: ' + t1 + ' is greater than 18446744073709551615');
                                    }
                                    return t1;
                                  })(remainderQuoteLock_0) });
    }
    let t_1;
    if (t_1 = askRemaining_0, t_1 > 0n) {
      const newAskId_0 = this._newOrderId_0(context, partialProofData);
      const newAskCmt_0 = this._makeCommitment_0(askPair_0,
                                                 this._dirAsk_0(),
                                                 askPrice_0,
                                                 askRemaining_0,
                                                 askPk_0,
                                                 askRemainderNonce_0);
      __compactRuntime.queryLedgerState(context,
                                        partialProofData,
                                        [
                                         { idx: { cached: false,
                                                  pushPath: true,
                                                  path: [
                                                         { tag: 'value',
                                                           value: { value: _descriptor_13.toValue(2n),
                                                                    alignment: _descriptor_13.alignment() } }] } },
                                         { push: { storage: false,
                                                   value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(newAskId_0),
                                                                                                alignment: _descriptor_0.alignment() }).encode() } },
                                         { push: { storage: true,
                                                   value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(newAskCmt_0),
                                                                                                alignment: _descriptor_0.alignment() }).encode() } },
                                         { ins: { cached: false, n: 1 } },
                                         { ins: { cached: true, n: 1 } }]);
      this._receiveShielded_0(context,
                              partialProofData,
                              { nonce: askRemainderNonce_0,
                                color: baseToken_0,
                                value: askRemaining_0 });
    }
    const tradeQuoteCost_0 = this._quoteCost_0(context,
                                               partialProofData,
                                               matchAmount_0,
                                               askPrice_0);
    const bidLocked_0 = this._quoteCost_0(context,
                                          partialProofData,
                                          matchAmount_0,
                                          bidPrice_0);
    const overbid_0 = (__compactRuntime.assert(bidLocked_0 >= tradeQuoteCost_0,
                                               'result of subtraction would be negative'),
                       bidLocked_0 - tradeQuoteCost_0);
    this._mintShieldedToken_0(context,
                              partialProofData,
                              baseToken_0,
                              matchAmount_0,
                              settlementNonce_0,
                              this._left_0({ bytes: bidPk_0 }));
    this._mintShieldedToken_0(context,
                              partialProofData,
                              quoteToken_0,
                              ((t1) => {
                                if (t1 > 18446744073709551615n) {
                                  throw new __compactRuntime.CompactError('InnermostFX.compact line 477 char 18: cast from Field or Uint value to smaller Uint value failed: ' + t1 + ' is greater than 18446744073709551615');
                                }
                                return t1;
                              })(tradeQuoteCost_0),
                              settlementNonce_0,
                              this._left_0({ bytes: askPk_0 }));
    let t_2;
    if (t_2 = overbid_0, t_2 > 0n) {
      this._mintShieldedToken_0(context,
                                partialProofData,
                                quoteToken_0,
                                ((t1) => {
                                  if (t1 > 18446744073709551615n) {
                                    throw new __compactRuntime.CompactError('InnermostFX.compact line 485 char 22: cast from Field or Uint value to smaller Uint value failed: ' + t1 + ' is greater than 18446744073709551615');
                                  }
                                  return t1;
                                })(overbid_0),
                                settlementNonce_0,
                                this._left_0({ bytes: bidPk_0 }));
    }
    const _tradeId_0 = this._newTradeId_0(context, partialProofData);
    return [];
  }
  _equal_0(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) { return false; }
    return true;
  }
  _equal_1(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) { return false; }
    return true;
  }
  _equal_2(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) { return false; }
    return true;
  }
  _equal_3(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) { return false; }
    return true;
  }
  _equal_4(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) { return false; }
    return true;
  }
  _equal_5(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) { return false; }
    return true;
  }
  _equal_6(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) { return false; }
    return true;
  }
  _equal_7(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) { return false; }
    return true;
  }
  _equal_8(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) { return false; }
    return true;
  }
  _equal_9(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) { return false; }
    return true;
  }
  _equal_10(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) { return false; }
    return true;
  }
  _equal_11(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) { return false; }
    return true;
  }
  _equal_12(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) { return false; }
    return true;
  }
  _equal_13(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) { return false; }
    return true;
  }
  _equal_14(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) { return false; }
    return true;
  }
  _equal_15(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) { return false; }
    return true;
  }
}
export function ledger(stateOrChargedState) {
  const state = stateOrChargedState instanceof __compactRuntime.StateValue ? stateOrChargedState : stateOrChargedState.state;
  const chargedState = stateOrChargedState instanceof __compactRuntime.StateValue ? new __compactRuntime.ChargedState(stateOrChargedState) : stateOrChargedState;
  const context = {
    currentQueryContext: new __compactRuntime.QueryContext(chargedState, __compactRuntime.dummyContractAddress()),
    costModel: __compactRuntime.CostModel.initialCostModel()
  };
  const partialProofData = {
    input: { value: [], alignment: [] },
    output: undefined,
    publicTranscript: [],
    privateTranscriptOutputs: []
  };
  return {
    get nextOrderId() {
      return _descriptor_1.fromValue(__compactRuntime.queryLedgerState(context,
                                                                       partialProofData,
                                                                       [
                                                                        { dup: { n: 0 } },
                                                                        { idx: { cached: false,
                                                                                 pushPath: false,
                                                                                 path: [
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_13.toValue(0n),
                                                                                                   alignment: _descriptor_13.alignment() } }] } },
                                                                        { popeq: { cached: false,
                                                                                   result: undefined } }]).value);
    },
    get nextTradeId() {
      return _descriptor_1.fromValue(__compactRuntime.queryLedgerState(context,
                                                                       partialProofData,
                                                                       [
                                                                        { dup: { n: 0 } },
                                                                        { idx: { cached: false,
                                                                                 pushPath: false,
                                                                                 path: [
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_13.toValue(1n),
                                                                                                   alignment: _descriptor_13.alignment() } }] } },
                                                                        { popeq: { cached: false,
                                                                                   result: undefined } }]).value);
    },
    orderCommitment: {
      isEmpty(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`isEmpty: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_2.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_13.toValue(2n),
                                                                                                     alignment: _descriptor_13.alignment() } }] } },
                                                                          'size',
                                                                          { push: { storage: false,
                                                                                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(0n),
                                                                                                                                 alignment: _descriptor_1.alignment() }).encode() } },
                                                                          'eq',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      size(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`size: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_1.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_13.toValue(2n),
                                                                                                     alignment: _descriptor_13.alignment() } }] } },
                                                                          'size',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      member(...args_0) {
        if (args_0.length !== 1) {
          throw new __compactRuntime.CompactError(`member: expected 1 argument, received ${args_0.length}`);
        }
        const key_0 = args_0[0];
        if (!(key_0.buffer instanceof ArrayBuffer && key_0.BYTES_PER_ELEMENT === 1 && key_0.length === 32)) {
          __compactRuntime.typeError('member',
                                     'argument 1',
                                     'InnermostFX.compact line 60 char 1',
                                     'Bytes<32>',
                                     key_0)
        }
        return _descriptor_2.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_13.toValue(2n),
                                                                                                     alignment: _descriptor_13.alignment() } }] } },
                                                                          { push: { storage: false,
                                                                                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(key_0),
                                                                                                                                 alignment: _descriptor_0.alignment() }).encode() } },
                                                                          'member',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      lookup(...args_0) {
        if (args_0.length !== 1) {
          throw new __compactRuntime.CompactError(`lookup: expected 1 argument, received ${args_0.length}`);
        }
        const key_0 = args_0[0];
        if (!(key_0.buffer instanceof ArrayBuffer && key_0.BYTES_PER_ELEMENT === 1 && key_0.length === 32)) {
          __compactRuntime.typeError('lookup',
                                     'argument 1',
                                     'InnermostFX.compact line 60 char 1',
                                     'Bytes<32>',
                                     key_0)
        }
        return _descriptor_0.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_13.toValue(2n),
                                                                                                     alignment: _descriptor_13.alignment() } }] } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_0.toValue(key_0),
                                                                                                     alignment: _descriptor_0.alignment() } }] } },
                                                                          { popeq: { cached: false,
                                                                                     result: undefined } }]).value);
      },
      [Symbol.iterator](...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`iter: expected 0 arguments, received ${args_0.length}`);
        }
        const self_0 = state.asArray()[2];
        return self_0.asMap().keys().map(  (key) => {    const value = self_0.asMap().get(key).asCell();    return [      _descriptor_0.fromValue(key.value),      _descriptor_0.fromValue(value.value)    ];  })[Symbol.iterator]();
      }
    },
    nullifierSet: {
      isEmpty(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`isEmpty: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_2.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_13.toValue(3n),
                                                                                                     alignment: _descriptor_13.alignment() } }] } },
                                                                          'size',
                                                                          { push: { storage: false,
                                                                                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(0n),
                                                                                                                                 alignment: _descriptor_1.alignment() }).encode() } },
                                                                          'eq',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      size(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`size: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_1.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_13.toValue(3n),
                                                                                                     alignment: _descriptor_13.alignment() } }] } },
                                                                          'size',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      member(...args_0) {
        if (args_0.length !== 1) {
          throw new __compactRuntime.CompactError(`member: expected 1 argument, received ${args_0.length}`);
        }
        const key_0 = args_0[0];
        if (!(key_0.buffer instanceof ArrayBuffer && key_0.BYTES_PER_ELEMENT === 1 && key_0.length === 32)) {
          __compactRuntime.typeError('member',
                                     'argument 1',
                                     'InnermostFX.compact line 64 char 1',
                                     'Bytes<32>',
                                     key_0)
        }
        return _descriptor_2.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_13.toValue(3n),
                                                                                                     alignment: _descriptor_13.alignment() } }] } },
                                                                          { push: { storage: false,
                                                                                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(key_0),
                                                                                                                                 alignment: _descriptor_0.alignment() }).encode() } },
                                                                          'member',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      lookup(...args_0) {
        if (args_0.length !== 1) {
          throw new __compactRuntime.CompactError(`lookup: expected 1 argument, received ${args_0.length}`);
        }
        const key_0 = args_0[0];
        if (!(key_0.buffer instanceof ArrayBuffer && key_0.BYTES_PER_ELEMENT === 1 && key_0.length === 32)) {
          __compactRuntime.typeError('lookup',
                                     'argument 1',
                                     'InnermostFX.compact line 64 char 1',
                                     'Bytes<32>',
                                     key_0)
        }
        return _descriptor_2.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_13.toValue(3n),
                                                                                                     alignment: _descriptor_13.alignment() } }] } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_0.toValue(key_0),
                                                                                                     alignment: _descriptor_0.alignment() } }] } },
                                                                          { popeq: { cached: false,
                                                                                     result: undefined } }]).value);
      },
      [Symbol.iterator](...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`iter: expected 0 arguments, received ${args_0.length}`);
        }
        const self_0 = state.asArray()[3];
        return self_0.asMap().keys().map(  (key) => {    const value = self_0.asMap().get(key).asCell();    return [      _descriptor_0.fromValue(key.value),      _descriptor_2.fromValue(value.value)    ];  })[Symbol.iterator]();
      }
    },
    get owner() {
      return _descriptor_0.fromValue(__compactRuntime.queryLedgerState(context,
                                                                       partialProofData,
                                                                       [
                                                                        { dup: { n: 0 } },
                                                                        { idx: { cached: false,
                                                                                 pushPath: false,
                                                                                 path: [
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_13.toValue(4n),
                                                                                                   alignment: _descriptor_13.alignment() } }] } },
                                                                        { popeq: { cached: false,
                                                                                   result: undefined } }]).value);
    }
  };
}
const _emptyContext = {
  currentQueryContext: new __compactRuntime.QueryContext(new __compactRuntime.ContractState().data, __compactRuntime.dummyContractAddress())
};
const _dummyContract = new Contract({
  localSk: (...args) => undefined,
  askSk: (...args) => undefined,
  witDivide: (...args) => undefined
});
export const pureCircuits = {
  getDappPubKey: (...args_0) => {
    if (args_0.length !== 1) {
      throw new __compactRuntime.CompactError(`getDappPubKey: expected 1 argument (as invoked from Typescript), received ${args_0.length}`);
    }
    const sk_0 = args_0[0];
    if (!(sk_0.buffer instanceof ArrayBuffer && sk_0.BYTES_PER_ELEMENT === 1 && sk_0.length === 32)) {
      __compactRuntime.typeError('getDappPubKey',
                                 'argument 1',
                                 'InnermostFX.compact line 99 char 1',
                                 'Bytes<32>',
                                 sk_0)
    }
    return _dummyContract._getDappPubKey_0(sk_0);
  }
};
export const contractReferenceLocations =
  { tag: 'publicLedgerArray', indices: { } };
//# sourceMappingURL=index.js.map
