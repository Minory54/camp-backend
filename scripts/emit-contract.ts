import { executeContractEmit } from "@prisma/orm-toolchain/cli/control-api";
import prismaConfig from "../prisma.config.js";

const result = await executeContractEmit({
  config: prismaConfig.orm,
  cwd: process.cwd(),
});

console.log(`Emitted ${result.files.json} and ${result.files.dts}`);
