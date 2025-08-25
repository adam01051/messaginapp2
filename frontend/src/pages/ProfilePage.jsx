import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { Camera, Mail, User, Contact } from "lucide-react";

// Lightbox imports
import Lightbox from "yet-another-react-lightbox";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";

const ProfilePage = () => {
	const { authUser, isUpdatingProfile, updateProfile, editProfileData } =
		useAuthStore();
	const [selectedImg, setSelectedImg] = useState(null);
	const [lightboxOpen, setLightboxOpen] = useState(false);

	// collect all profile pictures
	const profilePics = authUser?.profilePics || [];

	const [prototype1, setPrototype1] = useState({
		id: authUser.id,
		name: authUser.name,
		username: authUser.username,
		number: authUser.number,
		profilePic: profilePics[0]?.profile_url,
	});

	const handleProfileData = async () => {
		await editProfileData(prototype1);
	};

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

	// Lightbox slides
	const slides = profilePics.map((pic) => ({
		src: pic.profile_url,
	}));

	return (
		<div className="h-30 pt-20">
			<div className="max-w-2xl mx-auto p-4 py-8">
				<div className="bg-base-300 rounded-xl p-6 space-y-8">
					<div className="text-center">
						<h1 className="text-2xl font-semibold">Profile</h1>
						<p className="mt-2">Your profile information</p>
					</div>

					{/* avatar upload + preview */}
					<div className="flex flex-col items-center gap-4">
						<div className="relative">
							<img
								src={selectedImg || prototype1.profilePic || "/avatar.png"}
								alt="Profile"
								className="size-32 rounded-full object-cover border-4 cursor-pointer"
								onClick={() => slides.length > 0 && setLightboxOpen(true)}
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

					{/* Editable profile info */}
					<div className="space-y-8">
						<div className="space-y-1.5">
							<div className="text-sm text-zinc-400 flex items-center gap-2">
								<User className="w-4 h-6" />
								Full Name
							</div>
							<input
								type="text"
								className="input input-bordered w-full bg-base-200 rounded-lg border"
								value={prototype1?.name ?? ""}
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
								className="input input-bordered w-full bg-base-200 rounded-lg border"
								value={prototype1?.username ?? ""}
								onChange={(e) =>
									setPrototype1({
										...prototype1,
										username: e.target.value,
									})
								}
							/>
						</div>

						<div className="space-y-1.5">
							<div className="text-sm text-zinc-400 flex items-center gap-2">
								<Mail className="w-4 h-4" />
								Email Address
							</div>
							<p className="px-4 py-2.5 bg-base-200 rounded-lg border">
								{authUser?.email ?? ""}
							</p>
						</div>
						<div className="space-y-1.5">
							<div className="text-sm text-zinc-400 flex items-center gap-2">
								<Contact className="w-4 h-4" />
								Phone Number
							</div>

							<input
								type="tel"
								value={prototype1?.number ?? ""}
								className="input input-bordered w-full bg-base-200 rounded-lg border"
								onChange={(e) =>
									setPrototype1({ ...prototype1, number: e.target.value })
								}
							/>
						</div>

						<div className="h-30 w-full">
							<button onClick={handleProfileData} className="btn btn-success">
								Save
							</button>
						</div>
					</div>

					{/* Account info */}
					<div className="mt-6 bg-base-300 rounded-xl p-6">
						<h2 className="text-lg font-medium mb-4">Account Information</h2>
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

			{/* Lightbox for multiple profile pictures */}
			{slides.length > 0 && (
				<Lightbox
					open={lightboxOpen}
					close={() => setLightboxOpen(false)}
					slides={slides}
					plugins={[Thumbnails]}
				/>
			)}
		</div>
	);
};

export default ProfilePage;
