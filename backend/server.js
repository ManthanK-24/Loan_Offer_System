const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
app.use(express.json());

const PORT = 5000;
app.use(cors({
    origin: "http://localhost:5173", // Allow requests from Vite frontend
    methods: "GET,POST,PUT,DELETE",
    allowedHeaders: "Content-Type,Authorization"
}));
// Load lender criteria JSON file
const lendersDataPath = path.join(__dirname, "../lender_criteria.json");
const lendersData = JSON.parse(fs.readFileSync(lendersDataPath, "utf-8"));

// Endpoint to match lenders based on criteria
app.post("/match-lenders", (req, res) => {
    const { netAssets, prevNetAssets, tradingTime, loanAmount, companyName, companyAge } = req.body;

    if (!netAssets || !prevNetAssets || !tradingTime || !loanAmount || !companyName || !companyAge) {
        return res.status(400).json({ error: "All fields are required" });
    }
    const profit = netAssets - prevNetAssets;

    function calculateCompanyScore(companyAgeParams, companyNetAssets, companyProfit) {
        let companyScore = 0;

        // Condition for Company Age
        if (companyAgeParams >= 3) {
            companyScore += 2;
        } else if (companyAgeParams >= 1) {
            companyScore += 1;
        }

        // Condition for Company Net Assets
        if (companyNetAssets >= 250000) {
            companyScore += 2;
        } else if (companyNetAssets >= 50000) {
            companyScore += 1;
        }

        // Condition for Company Profit
        if (companyProfit >= 50000) {
            companyScore += 2;
        } else if (companyProfit >= 25000) {
            companyScore += 1;
        }

        return Math.min(companyScore, 6); // Ensure score is within [0,6]
    }
    const companyScore = calculateCompanyScore(companyAge, netAssets, profit);

    const eligibleLenders = Object.entries(lendersData).filter(([lender, details]) => {
        const lenderLoanRange = details["Loan Amount"].replace(/[^0-9\-]/g, "").split("-").map(Number);
        const lenderMinLoan = lenderLoanRange[0] || 0;
        const lenderMaxLoan = lenderLoanRange[1] || Infinity;

        // Check if the loan amount falls within the lender's range
        const isLoanEligible = lenderMinLoan <= loanAmount && loanAmount <= lenderMaxLoan;

        // Check if the trading time requirement is met
        const requiredTradingTime = parseInt(details["Min Trading Time"].replace(/\D/g, ""), 10);
        const isTradingTimeEligible = parseInt(tradingTime) >= requiredTradingTime;

        // Determine lender tier
        let lenderTier = 3; // Default to Tier 3
        if (companyScore >= 4) {
            lenderTier = 1;
        } else if (companyScore >= 2) {
            lenderTier = 2;
        }

        // Check if the lender belongs to the eligible tier
        const lenderTierInfo = details["Tier"] ? parseInt(details["Tier"].replace(/\D/g, ""), 10) : 3; // Default to Tier 3 if not specified
        const isTierEligible = lenderTier === lenderTierInfo;

        return isLoanEligible && isTradingTimeEligible && isTierEligible;
    });
    function convertLoanAmountRange(loanAmount) {
        if (!loanAmount) return [0, 0];

        const match = loanAmount.match(/([\d.]+)([kM]?)/g);
        if (!match) return [0, 0];

        function convert(value) {
            let num = parseFloat(value);
            if (value.includes("k")) num *= 1000;
            if (value.includes("M")) num *= 1000000;
            return Math.round(num);
        }

        let lowerLimit = convert(match[0]);
        let upperLimit = match[1] ? convert(match[1]) : lowerLimit;

        return [lowerLimit, upperLimit];
    }

    function extractInterestRate(rateStr) {
        console.log('rateStr', rateStr)
        if (!rateStr) return [0, 0];

        const rates = rateStr.match(/[\d.]+/g)?.map(rate => parseFloat(rate) / 100) || [0];
        return rates.length > 1 ? rates : [rates[0], rates[0]];
    }

    function extractLoanTerm(termStr) {
        if (!termStr) return [1, 1]; // Default to 1 year if missing

        const terms = termStr.match(/\d+/g)?.map(Number) || [12];
        return terms.length > 1 ? [terms[0], terms[1]] : [terms[0], terms[0]];
    }

    function calculateMonthlyRepayment(P, r, t) {
        if (P === 0 || r === 0 || t === 0) return 0;
        return Math.round((P * (1 + r)) / t * 100) / 100;
    }

    function getRepaymentInfo(loanAmountStr, rateStr, termStr, lender) {
        console.log('lender', lender);
        const [lowerAmount, upperAmount] = convertLoanAmountRange(loanAmountStr);
        const [minRate, maxRate] = extractInterestRate(rateStr);
        const [minTerm, maxTerm] = extractLoanTerm(termStr);

        console.log('minRate', minRate, 'maxRate', maxRate, 'minTerm', minTerm, 'maxTerm', maxTerm)
        const minRepayment = calculateMonthlyRepayment(lowerAmount, minRate, parseFloat(termStr));
        const maxRepayment = calculateMonthlyRepayment(upperAmount, maxRate, parseFloat(termStr));

        return `${minRepayment} - ${maxRepayment}`;
    }


    // Format response with the lender criteria
    const response = eligibleLenders.map(([lender, details]) => ({
        lender,
        tier: details["Tier"],
        loanAmount: details["Loan Amount"],
        term: details["Term"],
        rates: details["Rates"],
        monthlyRepayment: getRepaymentInfo(loanAmount, details["Rates"], details["Term"], lender),
    }));

    res.json({ eligibleLenders: response });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
