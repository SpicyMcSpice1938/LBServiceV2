import { useState } from "react";
import { useNavigate } from "react-router-dom";


export default function SearchBar(){
	const [searchInput, setSearchInput] = useState("");
	const navigate = useNavigate();

	const handleSearch = (e) => {
		e.preventDefault();
		if (searchInput.trim()) {
			navigate(`/watched/${searchInput.trim()}`);
			setSearchInput("");
		}
	};

	return(
		<div className="search-bar-container">
			<form onSubmit={handleSearch}>
				<input 
					type="text"
					placeholder="Enter username..."
					value={searchInput}
					onChange={(e) => setSearchInput(e.target.value)}
					className="search-input"
				/>
				<button type="submit" className="search-button">
					Search
				</button>
			</form>
		</div>
	)
}