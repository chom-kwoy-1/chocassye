import EnglishG2P from "./en-g2p";
import { useG2P } from "./g2p";

// eslint-disable-next-line react-hooks/rules-of-hooks
useG2P(new EnglishG2P());

export * from "./core";
