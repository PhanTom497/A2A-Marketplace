import { expect } from "chai";
import { ethers } from "hardhat";
import { KnowledgeMarketplace } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("KnowledgeMarketplace", function () {
    let marketplace: KnowledgeMarketplace;
    let owner: SignerWithAddress;
    let server: SignerWithAddress;
    let creator: SignerWithAddress;
    let attacker: SignerWithAddress;

    const apiKey = ethers.keccak256(ethers.toUtf8Bytes("test-api-key"));
    const paymentAmount = 1000n; // 0.001 USDC
    const endpoint = "/api/v1/stablecoins/arc";

    beforeEach(async function () {
        [owner, server, creator, attacker] = await ethers.getSigners();

        const KnowledgeMarketplaceFactory = await ethers.getContractFactory("KnowledgeMarketplace");
        marketplace = await KnowledgeMarketplaceFactory.deploy(server.address);
        await marketplace.waitForDeployment();
    });

    describe("Deployment", function () {
        it("Should set the correct owner", async function () {
            expect(await marketplace.owner()).to.equal(owner.address);
        });

        it("Should set the correct server", async function () {
            expect(await marketplace.server()).to.equal(server.address);
        });

        it("Should initialize with zero stats", async function () {
            const [totalRequests, totalRevenue] = await marketplace.getStats();
            expect(totalRequests).to.equal(0n);
            expect(totalRevenue).to.equal(0n);
        });

        it("Should revert if server address is zero", async function () {
            const KnowledgeMarketplaceFactory = await ethers.getContractFactory("KnowledgeMarketplace");
            await expect(
                KnowledgeMarketplaceFactory.deploy(ethers.ZeroAddress)
            ).to.be.revertedWithCustomError(marketplace, "InvalidServerAddress");
        });
    });

    describe("Access Control", function () {
        it("Should allow only server to record payments", async function () {
            await expect(
                marketplace.connect(server).recordPayment(creator.address, apiKey, paymentAmount, endpoint)
            ).to.emit(marketplace, "PaymentReceived");
        });

        it("Should revert when non-server tries to record payment", async function () {
            await expect(
                marketplace.connect(attacker).recordPayment(creator.address, apiKey, paymentAmount, endpoint)
            ).to.be.revertedWithCustomError(marketplace, "OnlyServerCanCall");
        });

        it("Should allow only owner to update server", async function () {
            await expect(
                marketplace.connect(owner).setServer(attacker.address)
            ).to.emit(marketplace, "ServerUpdated");

            expect(await marketplace.server()).to.equal(attacker.address);
        });

        it("Should revert when non-owner tries to update server", async function () {
            await expect(
                marketplace.connect(attacker).setServer(attacker.address)
            ).to.be.revertedWithCustomError(marketplace, "OwnableUnauthorizedAccount");
        });

        it("Should revert when setting server to zero address", async function () {
            await expect(
                marketplace.connect(owner).setServer(ethers.ZeroAddress)
            ).to.be.revertedWithCustomError(marketplace, "InvalidServerAddress");
        });
    });

    describe("Payment Recording", function () {
        it("Should record payment and update creator revenue", async function () {
            await marketplace.connect(server).recordPayment(creator.address, apiKey, paymentAmount, endpoint);

            expect(await marketplace.getCreatorRevenue(creator.address)).to.equal(paymentAmount);
        });

        it("Should record payment and update API key revenue", async function () {
            await marketplace.connect(server).recordPayment(creator.address, apiKey, paymentAmount, endpoint);

            expect(await marketplace.getApiKeyRevenue(apiKey)).to.equal(paymentAmount);
        });

        it("Should update total stats", async function () {
            await marketplace.connect(server).recordPayment(creator.address, apiKey, paymentAmount, endpoint);

            const [totalRequests, totalRevenue] = await marketplace.getStats();
            expect(totalRequests).to.equal(1n);
            expect(totalRevenue).to.equal(paymentAmount);
        });

        it("Should accumulate revenue for multiple payments", async function () {
            await marketplace.connect(server).recordPayment(creator.address, apiKey, paymentAmount, endpoint);
            await marketplace.connect(server).recordPayment(creator.address, apiKey, paymentAmount, endpoint);
            await marketplace.connect(server).recordPayment(creator.address, apiKey, paymentAmount, endpoint);

            expect(await marketplace.getCreatorRevenue(creator.address)).to.equal(paymentAmount * 3n);

            const [totalRequests, totalRevenue] = await marketplace.getStats();
            expect(totalRequests).to.equal(3n);
            expect(totalRevenue).to.equal(paymentAmount * 3n);
        });

        it("Should emit PaymentReceived event with correct parameters", async function () {
            const tx = await marketplace.connect(server).recordPayment(
                creator.address,
                apiKey,
                paymentAmount,
                endpoint
            );

            await expect(tx)
                .to.emit(marketplace, "PaymentReceived")
                .withArgs(
                    creator.address,
                    apiKey,
                    paymentAmount,
                    endpoint,
                    (timestamp: bigint) => timestamp > 0n
                );
        });
    });

    describe("Revenue Withdrawal", function () {
        beforeEach(async function () {
            // Fund the contract
            await owner.sendTransaction({
                to: await marketplace.getAddress(),
                value: ethers.parseEther("1"),
            });
        });

        it("Should allow creator to withdraw their revenue", async function () {
            // Record a payment
            await marketplace.connect(server).recordPayment(creator.address, apiKey, paymentAmount, endpoint);

            // Verify revenue exists
            const revenueBefore = await marketplace.getCreatorRevenue(creator.address);
            expect(revenueBefore).to.equal(paymentAmount);

            // Withdraw
            await expect(marketplace.connect(creator).withdrawRevenue())
                .to.emit(marketplace, "RevenueWithdrawn");

            // Verify revenue is zero after withdrawal
            const revenueAfter = await marketplace.getCreatorRevenue(creator.address);
            expect(revenueAfter).to.equal(0n);
        });

        it("Should revert if no revenue to withdraw", async function () {
            await expect(
                marketplace.connect(attacker).withdrawRevenue()
            ).to.be.revertedWithCustomError(marketplace, "NoRevenueToWithdraw");
        });
    });

    describe("Server Update", function () {
        it("Should emit ServerUpdated event with old and new addresses", async function () {
            const tx = await marketplace.connect(owner).setServer(attacker.address);

            await expect(tx)
                .to.emit(marketplace, "ServerUpdated")
                .withArgs(
                    server.address,
                    attacker.address,
                    (timestamp: bigint) => timestamp > 0n
                );
        });

        it("Should allow new server to record payments after update", async function () {
            await marketplace.connect(owner).setServer(attacker.address);

            // Old server should fail
            await expect(
                marketplace.connect(server).recordPayment(creator.address, apiKey, paymentAmount, endpoint)
            ).to.be.revertedWithCustomError(marketplace, "OnlyServerCanCall");

            // New server should succeed
            await expect(
                marketplace.connect(attacker).recordPayment(creator.address, apiKey, paymentAmount, endpoint)
            ).to.emit(marketplace, "PaymentReceived");
        });
    });
});
