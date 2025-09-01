import React, { useState,useEffect } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { Check } from "lucide-react";

const SearchPage = () => {
	const [username, setUsername] = useState("");
    const { searchUser, searchResults, addUser,addResults} = useAuthStore();

	const handleSearch = () => {
		searchUser(username); // triggers API call and updates Zustand state
	};

	const handleAdd = () => {
		
        addUser(username);
    }
	
	useEffect(() => {
		console.log("Updated search results:", searchResults);
	}, [searchResults]);
    	
	useEffect(() => {
		if (addResults?.success) {
			console.log("New contact ID:", addResults.contactId);
		}
	}, [addResults]);
    

    
	return (
		<div className="min-h-screen  pt-16 flex flex-col items-center m-5">
			{/* Search Bar */}
			<fieldset className="fieldset bg-base-200 border-base-300 rounded-box w-xs border m-10 p-10 ">
				<legend className="fieldset-legend mt-10 pt-10">User Search</legend>
				<input
					type="text"
					value={username}
					onChange={(e) => setUsername(e.target.value)}
					className="input w-full"
					placeholder="Search by username..."
				/>
				<button onClick={handleSearch} className="btn btn-primary mt-2 w-full">
					Search
				</button>
			</fieldset>

			{/* Results Section */}
			<div className="w-full flex justify-center mt-6 px-4">
				<div className="w-full max-w-3xl">
					{searchResults !== null && searchResults.length === 0 && (
						<p className="text-center text-gray-500">No results found</p>
					)}

					{searchResults && searchResults.length > 0 && (
						<div className="overflow-x-auto">
							<table className="table w-full">
								<thead>
									<tr>
										<th>Name</th>
									</tr>
								</thead>
								<tbody>
									{searchResults.map((user) => (
										<tr key={user.id}>
											<td>
												<div className="flex items-center gap-3">
													<div className="avatar">
														<div className="mask mask-squircle h-12 w-12">
															<img
																src={user.profileimage || "/avatar.png"}
																alt={user.name}
															/>
														</div>
													</div>
													<div>
														<div className="font-bold">{user.name}</div>
													</div>
												</div>
											</td>
											<th>
												{addResults?.success ? (
													<div className="badge badge-success gap-2 h-5">
														<Check className="h-5 w-4" />
														Done
													</div>
												) : (
													<button
														onClick={handleAdd}
														className="btn btn-ghost btn-xs"
													>
														Add Contact
													</button>
												)}
											</th>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default SearchPage;
