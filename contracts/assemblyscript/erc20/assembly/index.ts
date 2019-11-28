import { u256, u128 } from "bignum";

import {
  getCaller,
  getScratchBuffer,
  getStorage,
  getValueTransferred,
  setRentAllowance,
  setScratchBuffer,
  setStorage,
  toBytes
} from "./lib";

// Create a new Uint8Array of length 32
const ERC20_SUPPLY_STORAGE = (new Uint8Array(32)).fill(3);

enum Action {
  TotalSupply, // -> Balance
  BalanceOf, // -> Balance
  Allowance, // -> Balance
  Transfer, // -> bool
  Approve, // -> bool
  TransferFrom, // -> bool
  SelfEvict
}

function handle(input: Uint8Array): Uint8Array {
  const value = new Uint8Array(0);

  const totalSupply = getStorage(ERC20_SUPPLY_STORAGE);
  const totalSupplyDataView = new DataView(totalSupply.buffer);
  const totalSupplyValue = totalSupplyDataView.byteLength ? totalSupplyDataView.getUint8(0) : 0;

  // Get action from first byte of the input U8A
  switch (input[0]) {
    case Action.TotalSupply: // first byte: 0x00
      // return the counter from storage
      if (totalSupply.length) return totalSupply;
      break;
    case Action.BalanceOf: { // first byte: 0x01
      // read 32 bytes (u256) from storageBuffer with offset 1
      const owner = load<Uint8Array>(input.dataStart, 1);

      const balance = getStorage(owner.subarray(0, 32));
      const balanceDataView = new DataView(balance.buffer);
      const balanceValue = balanceDataView.byteLength ? balanceDataView.getUint8(0) : 0;

      // return toBytes(balanceValue);
      return (new Uint8Array(32)).fill(65);
      break;
    }
    // case Action.Allowance: { // first byte: 0x02
    //   const owner = load<u32>(input.dataStart, 1);
    //   const spender = load<u32>(input.dataStart, 5);
    //   if (totalSupply.length) return totalSupply;
    //   break;
    // }
    // case Action.Transfer: { // first byte: 0x03
    //   // const to = load<u32>(input.dataStart, 1);
    //   const value = load<u64>(input.dataStart, 33);
    //   // return the counter from storage
    //   if (totalSupply.length) return totalSupply;
    //   break;
    // }
    // case Action.Approve: { // first byte: 0x04
    //   const spender = load<u32>(input.dataStart, 1);
    //   const value = load<u32>(input.dataStart, 5);
    //   // return the counter from storage
    //   if (totalSupply.length) return totalSupply;
    //   break;
    // }
    case Action.TransferFrom: { // first byte: 0x05
      const from = load<u32>(input.dataStart, 1);
      const to = load<u32>(input.dataStart, 17);
      const value = load<u32>(input.dataStart, 33);
      // return the counter from storage
      if (totalSupply.length) return totalSupply;
      break;
    }
    case Action.SelfEvict: // first byte: 0x06
      const allowance = u128.from<u32>(0);
      setRentAllowance(allowance);
      break;
  }
  return value;
}

export function call(): u32 {
  const input = getScratchBuffer();
  const output = handle(input);

  setScratchBuffer(output);
  return 0;
}

// deploy a new instance of the contract with the default value 0x00 (false)
export function deploy(): u32 {
  // Get and store endowment as total supply in scratch buffer
  getValueTransferred()
  const totalSupply = getScratchBuffer();
  setStorage(ERC20_SUPPLY_STORAGE, totalSupply);
  
  // Get and store the address of the caller to scratch buffer 
  getCaller();
  const CALLER = getScratchBuffer();
  // Create a new storage entry with the address of the contract caller
  // and assign the total supply of the contract to the creators account.
  // In more advanced implementations you might want to hash this with a crypto function

  setStorage(CALLER, totalSupply);
  return 0;
}

