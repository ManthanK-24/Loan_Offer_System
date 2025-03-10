import { useState } from "react";
import axios from "axios";
import API_BASE_URL from "../config";

const LoanForm = () => {
  const [formData, setFormData] = useState({
    companyName: "",
    loanAmount: "",
    netAssets: "",
    prevYearNetAsset: "",
    loanTenure: "",
  });

  const [lenders, setLenders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setLenders([]);

    try {
        console.log("Sending data:", formData);
      const response = await axios.post(`${API_BASE_URL}/match-lenders`, formData);
       console.log("Response received:", response.data);
        
       if (response.data.eligibleLenders?.length === 0) {
         setError("No eligible lenders found.");
      }
      setLenders(response.data.eligibleLenders);
    } catch (err) {
      setError("Error fetching lenders. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-xl font-bold mb-4">Loan Eligibility Form</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input type="text" name="companyName" value={formData.companyName} onChange={handleChange} placeholder="Company Name" required className="w-full p-2 border rounded" />
        <input type="number" name="loanAmount" value={formData.loanAmount} onChange={handleChange} placeholder="Loan Amount" required className="w-full p-2 border rounded" />
        <input type="number" name="netAssets" value={formData.netAssets} onChange={handleChange} placeholder="Net Assets" required className="w-full p-2 border rounded" />
        <input type="number" name="prevYearNetAsset" value={formData.prevYearNetAsset} onChange={handleChange} placeholder="Previous Year Net Assets" required className="w-full p-2 border rounded" />
        <input type="number" name="loanTenure" value={formData.loanTenure} onChange={handleChange} placeholder="Loan Tenure (months)" required className="w-full p-2 border rounded" />

        <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600" disabled={loading}>
          {loading ? "Checking..." : "Find Lenders"}
        </button>
      </form>

      {error && <p className="text-red-500 mt-4">{error}</p>}

      {lenders.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Eligible Lenders:</h3>
          <ul className="list-disc pl-5 space-y-2">
            {lenders.map((lender, index) => (
              <li key={index} className="border p-2 rounded shadow-sm">
                <strong>{lender.lender_name}</strong> - Interest Rate: {lender.interest_rate}%
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default LoanForm;
