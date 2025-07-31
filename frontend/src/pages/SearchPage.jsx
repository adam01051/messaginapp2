import React, { useState } from "react";

const SearchPage = () => {
	const [query, setQuery] = useState("");
	const [results, setResults] = useState(null); // null = not searched yet

	const handleSearch = () => {
		// Placeholder logic (replace with API call later)
		if (query.toLowerCase() === "john") {
			setResults([
				{
					id: 1,
					name: "John Doe",
					location: "United States",
					job: "Software Engineer",
					company: "Tech Corp",
					color: "Blue",
					avatar: "https://img.daisyui.com/images/profile/demo/2@94.webp",
				},
			]);
		} else {
			setResults([]);
		}
	};

	return (
		<div className="min-h-screen  pt-16 flex flex-col items-center m-5">
			{/* Search Bar */}
			<fieldset className="fieldset bg-base-200 border-base-300 rounded-box w-xs border p-10 ">
				<legend className="fieldset-legend pt-10">User Search</legend>
				<input
					type="text"
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					className="input w-full"
					placeholder="Search by name..."
				/>
				<button onClick={handleSearch} className="btn btn-primary mt-2 w-full">
					Search
				</button>
			</fieldset>

			{/* Results Section */}
			<div className="w-full flex justify-center mt-6 px-4">
				<div className="w-full max-w-3xl">
					{results !== null && results.length === 0 && (
						<p className="text-center text-gray-500">No results found</p>
					)}

					{results && results.length > 0 && (
						<div className="overflow-x-auto">
							<table className="table w-full">
								<thead>
									<tr>
										<th></th>
										<th>Name</th>
										<th>Job</th>
										<th>Favorite Color</th>
										<th></th>
									</tr>
								</thead>
								<tbody>
									{results.map((user) => (
										<tr key={user.id}>
											<th>
												<label>
													<input type="checkbox" className="checkbox" />
												</label>
											</th>
											<td>
												<div className="flex items-center gap-3">
													<div className="avatar">
														<div className="mask mask-squircle h-12 w-12">
															<img src={user.avatar} alt={user.name} />
														</div>
													</div>
													<div>
														<div className="font-bold">{user.name}</div>
														<div className="text-sm opacity-50">
															{user.location}
														</div>
													</div>
												</div>
											</td>
											<td>
												{user.company}
												<br />
												<span className="badge badge-ghost badge-sm">
													{user.job}
												</span>
											</td>
											<td>{user.color}</td>
											<th>
												<button className="btn btn-ghost btn-xs">
													details
												</button>
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
