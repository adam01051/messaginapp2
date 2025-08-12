import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { Camera, Mail, User } from "lucide-react";

// starting again


const ProfilePage = () => {
	const { authUser, isUpdatingProfile, updateProfile } = useAuthStore();
	const [selectedImg, setSelectedImg] = useState(null);

	const [prototype1, setPrototype1] = useState({
		id: authUser.id,
		name: authUser.name,
		username: authUser.username,
		password_: authUser.password_,
		profileimage: authUser.profileimage,
		email: authUser.email,
		number:authUser.number
	})

	
	const handleImageUpload = async (e) => {
		const file = e.target.files[0];
		if (!file) return;

		const reader = new FileReader();

		reader.readAsDataURL(file);

		reader.onload = async () => {
			const base64Image = reader.result;
			setSelectedImg(base64Image);
			await updateProfile({ profilePic: base64Image });
		};
	};

	return (
		<div className="h-30 pt-20">
			<div className="max-w-2xl mx-auto p-4 py-8">
				<div className="bg-base-300 rounded-xl p-6 space-y-8">
					<div className="text-center">
						<h1 className="text-2xl font-semibold ">Profile</h1>
						<p className="mt-2">Your profile information</p>
					</div>

					{/* avatar upload section */}

					<div className="flex flex-col items-center gap-4">
						<div className="relative">
							<img
								src={selectedImg || authUser.profileimage || "/avatar.png"}
								alt="Profile"
								className="size-32 rounded-full object-cover border-4 "
							/>
							<label
								htmlFor="avatar-upload"
								className={`
                  absolute bottom-0 right-0 
                  bg-base-content hover:scale-105
                  p-2 rounded-full cursor-pointer 
                  transition-all duration-200
                  ${
										isUpdatingProfile ? "animate-pulse pointer-events-none" : ""
									}
                `}
							>
								<Camera className="w-5 h-5 text-base-200" />
								<input
									type="file"
									id="avatar-upload"
									className="hidden"
									accept="image/*"
									onChange={handleImageUpload}
									disabled={isUpdatingProfile}
								/>
							</label>
						</div>
						<p className="text-sm text-zinc-400">
							{isUpdatingProfile
								? "Uploading..."
								: "Click the camera icon to update your photo"}
						</p>
					</div>

					<div className="space-y-8">
						<div className="space-y-1.5">
							<div className="text-sm text-zinc-400 flex items-center gap-2">
								<User className="w-4 h-6" />
								Full Name
							</div>
							<input
								type="text"
								className={`input input-bordered w-full bg-base-200 rounded-lg border`}
								value={prototype1?.name}
								onChange={(e) =>
									setPrototype1({ ...prototype1, name: e.target.value })
								}
							/>
						</div>
						<div className="space-y-1.5">
							<div className="text-sm text-zinc-400 flex items-center gap-2">
								<User className="w-4 h-4" />
								Username
							</div>
							<input
								type="text"
								className={`input input-bordered w-full bg-base-200 rounded-lg border`}
								value={prototype1?.username}
								onChange={(e) =>
									setPrototype1({ ...prototype1, username: e.target.value })
								}
							/>
						</div>

						<div className="space-y-1.5">
							<div className="text-sm text-zinc-400 flex items-center gap-2">
								<Mail className="w-4 h-4" />
								Email Address
							</div>
							<input
								type="email"
								className={`input input-bordered w-full bg-base-200 rounded-lg border`}
								value={prototype1?.email}
								onChange={(e) =>
									setPrototype1({ ...prototype1, email: e.target.value })
								}
							/>
						</div>
						<div className="space-y-1.5">
							<div className="text-sm text-zinc-400 flex items-center gap-2">
								<User className="w-4 h-4" />
								Phone Number
							</div>
							<input
								type="tel"
								placeholder="Add phone number"
								className={`input input-bordered w-full bg-base-200 rounded-lg border`}
								value={prototype1?.number}
								onChange={(e) =>
									setPrototype1({ ...prototype1, number: e.target.value })
								}
							/>
						</div>

						<div className="h-30 w-full">
							<button className="btn btn-success  ">
								Success
							</button>
						</div>
					</div>

					<div className="mt-6 bg-base-300 rounded-xl p-6">
						<h2 className="text-lg font-medium  mb-4">Account Information</h2>
						<div className="space-y-3 text-sm">
							<div className="flex items-center justify-between py-2 border-b border-zinc-700">
								<span>Member Since</span>
								<span>{authUser.createdAt?.split("T")[0]}</span>
							</div>
							<div className="flex items-center justify-between py-2">
								<span>Account Status</span>
								<span className="text-green-500">Active</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};
export default ProfilePage;
