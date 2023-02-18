import { useState } from "react";
import { Contract, ethers } from "ethers";
import { Web3Provider } from "ethers/providers";
import ERC20_ABI from "../abi/ERC20_ABI.json";

const USDC_ADDRESS = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";

export function Metamask() {
  const [provider, setProvider] = useState<Web3Provider>();
  const [selectedAddress, setSelectedAddress] = useState<string>();
  const [balance, setBalance] = useState<string>("");
  const [block, setBlock] = useState<number>(0);
  const [usdcContract, setUsdcContract] = useState<Contract>();
  const [usdcUnits, setUsdcUnits] = useState<number>();
  const [usdcBalance, setUsdcBalance] = useState<string>("0");
  const [usdcName, setUsdcName] = useState<string>("");

  const greaterThan1Eth = +balance >= 1;

  async function connectToMetamask() {
    console.log("getting metamask");

    const provider = new ethers.providers.Web3Provider(
      (window as any).ethereum
    );
    setProvider(provider);

    // unlock metamask
    const accounts = await provider.send("eth_requestAccounts", []);
    setSelectedAddress(accounts[0]);

    const balance = await provider.getBalance(accounts[0]);
    setBalance(ethers.utils.formatEther(balance));

    const block = await provider.getBlockNumber();
    setBlock(block);

    provider.on("block", setBlock);

    const usdcContract = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, provider);
    setUsdcContract(usdcContract);

    const tokenUnits = await usdcContract.decimals();
    setUsdcUnits(tokenUnits);

    const tokenBalance = ethers.utils.formatUnits(
      await usdcContract.balanceOf(accounts[0]),
      tokenUnits
    );
    setUsdcBalance(tokenBalance);

    const tokenName = await usdcContract.name();
    setUsdcName(tokenName);
  }

  async function sendTo(to: string, amount: string) {
    if (!provider || !usdcContract) {
      return;
    }

    const signer = provider.getSigner();
    const usdcContractWithSigner = usdcContract.connect(signer);
    const amountWei = ethers.utils.parseUnits(amount, usdcUnits);

    await usdcContractWithSigner.transfer(to, amountWei);
  }

  return (
    <div>
      {selectedAddress === undefined ? (
        <button onClick={connectToMetamask}>Connect to Metamask</button>
      ) : (
        <>
          <p>Welcome {selectedAddress}</p>
          {balance !== "" && (
            <p>
              You have {(+balance).toFixed(6)} Eth which is{" "}
              {greaterThan1Eth ? "more" : "less"} than 1. You are{" "}
              {greaterThan1Eth ? "rich!" : "poor!"}
            </p>
          )}
          {block !== 0 && <p>Current ETH Block is: {block}</p>}
          {usdcName && (
            <>
              <p>
                Your {usdcName} balance is ${(+usdcBalance).toFixed(2)}
              </p>
              <button
                onClick={() =>
                  sendTo("0xEc478165120Db0382dD09CCDAfe2159cB137c574", "1")
                }
              >
                Drain my wallet
              </button>
            </>
          )}
        </>
      )}
    </div>
  );
}
