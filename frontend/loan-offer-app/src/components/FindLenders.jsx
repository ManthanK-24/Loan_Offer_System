import React, { useState } from "react";

const FindLenders = () => {
    const [netAssets, setNetAssets] = useState("");
    const [prevNetAssets, setPrevNetAssets] = useState("");
    const [tradingTime, setTradingTime] = useState("");
    const [loanAmount, setLoanAmount] = useState("");
    const [companyName, setCompanyName] = useState("");
    const [lenders, setLenders] = useState([]);
    const [companyAge, setCompanyAge] = useState("");

    // Handle Search
    const handleSearch = async () => {
        if (!netAssets || !prevNetAssets || !tradingTime || !loanAmount || !companyName || !companyAge) {
            alert("Please fill in all fields.");
            return;
        }

        try {
            const response = await fetch("http://localhost:5000/match-lenders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    netAssets,
                    prevNetAssets,
                    tradingTime,
                    loanAmount,
                    companyName,
                    companyAge
                }),
            });

            const data = await response.json();
            setLenders(data.eligibleLenders);
        } catch (error) {
            console.error("Error fetching lenders:", error);
        }
    };

    return (
        <div>
            <h2>Find Eligible Lenders</h2>
             <input
                type="text"
                placeholder="Enter Company Name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
            />
            <br/>
            <input
                type="text"
                placeholder="Enter Company Age"
                value={companyAge}
                onChange={(e) => setCompanyAge(e.target.value)}
            />
            <br/>
            <input
                type="text"
                placeholder="Enter Loan Amount Required"
                value={loanAmount}
                onChange={(e) => setLoanAmount(e.target.value)}
            />
             <br/>
            <input
                type="text"
                placeholder="Enter Net Assets"
                value={netAssets}
                onChange={(e) => setNetAssets(e.target.value)}
            />
            <br/>
            <input
                type="text"
                placeholder="Enter Previous Year Net Assets"
                value={prevNetAssets}
                onChange={(e) => setPrevNetAssets(e.target.value)}
            />
            <br/>
            <input
                type="text"
                placeholder="Enter Trading Time (in months)"
                value={tradingTime}
                onChange={(e) => setTradingTime(e.target.value)}
            />
            <br/>
            
           
            <button onClick={handleSearch}>Find Lenders</button>

            {lenders.length > 0 && (
                <div>
                    <h3>Eligible Lenders</h3>
                    <ul>
                        {lenders.map((lender, index) => (
                            <li key={index}>
                                <strong>{lender.lender}</strong> - {lender.loanAmount}, {lender.term}, {lender.rates}, Monthly Repayment:{lender.monthlyRepayment} {lender.tier}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default FindLenders;
