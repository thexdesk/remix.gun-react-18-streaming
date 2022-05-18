import {
  Memo as _Memo,
  MemoType as _MemoType
} from 'stellar-sdk';

import { gun } from "~/server"
import Gun, { ISEAPair } from 'gun';
import invariant from '@remix-run/react/invariant';

const APP_KEY_PAIR = {
  pub: process.env.PUB,
  priv: process.env.PRIV,
  epub: process.env.EPUB,
  epriv: process.env.EPRIV,
} as ISEAPair

export namespace Memo {
  export const none = (): _Memo<_MemoType.None> => _Memo.none();

  export const text = (text: string): _Memo<_MemoType.Text> =>
    _Memo.text(text);

  export const id = (num: string): _Memo<_MemoType.ID> =>
    _Memo.id(num);

  export const hash = (str: string): _Memo<_MemoType.Hash> =>
    _Memo.hash(str);

  export const refund = (str: string): _Memo<_MemoType.Return> =>
    _Memo.return(str);

  export namespace GunStore {
    export const setText = async (text: string): Promise<_Memo> => {
      let encoded = await Gun.SEA.work(text, APP_KEY_PAIR) as string;
      invariant(encoded, 'GunDB.setText: failed to hash text');
      gun.get("STELLAR_MEMOS").get(encoded).put({ text });
      return hash(encoded)
    }

    export const getText = async (encodedMemoHash: string): Promise<string> => {
      const decode = Buffer.from(encodedMemoHash, 'base64').toString('hex');
      const memo = await gun.get("STELLAR_MEMOS").get(decode).get("text").then();
      return memo;
    }
  }
}

export type MemoType =
  _Memo<
    _MemoType.ID |
    _MemoType.Hash |
    _MemoType.None |
    _MemoType.Text |
    _MemoType.Return
  >;


export type MemoValueType =
  number |
  string |
  Uint8Array |
  null |
  undefined;


