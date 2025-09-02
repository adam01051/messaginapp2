import { X, User, Mail,Contact } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import {  useEffect ,useState} from "react";

import "react-medium-image-zoom/dist/styles.css";

import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";

import Counter from "yet-another-react-lightbox/plugins/counter";

import "yet-another-react-lightbox/plugins/counter.css";


const ChatHeader = () => {
	const { selectedUser, getUsers, setSelectedUser, deleteUser, addUser } =
		useChatStore();
	const { onlineUsers, profilePics } = useAuthStore();
	const [userPics, setUserPics] = useState([]);
	const [lightboxOpen, setLightboxOpen] = useState(false);


	useEffect(() => {
		

	
		if (profilePics && selectedUser) {

			const pics = profilePics.filter(
				(pic) => pic.user_ref === selectedUser.id
			);

			setUserPics(pics);
		}
	}, [profilePics, selectedUser]);


	const handleAdd =  async () => {
		addUser(selectedUser.username);
		setSelectedUser({
			...selectedUser,
			is_contact: true,
		});

		// Optionally refresh contact list from backend
		await getUsers();
		
	};

	const deleteContact = async () => {
		deleteUser(selectedUser);
		await getUsers();
		
		
	
	};
	
	
	const slides = userPics.map((pic) => ({
		src: pic.profile_url,
	}));




	return (
		<>
			{/* Header */}

			<div className="p-2.5 border-b border-base-300 flex justify-between">
				<div className="flex items-center ">
					<label
						htmlFor="my_modal_7"
						className="btn bg-transparent  hover:bg-transparent  border-hidden border-opacity-0 rounded-none border-0 shadow-none"
					>
						<div className="flex min-w-full ">
							<div className=" cursor-pointer flex items-center  gap-3">
								{/* Avatar */}
								<div className="avatar">
									<div className="size-10 rounded-full relative">
										<img
											src={
												userPics.length > 0
													? userPics[0].profile_url
													: "/avatar.png"
											}
											alt={selectedUser?.name}
										/>
									</div>
								</div>

								{/* User info */}
								<div className="">
									<h3 className="font-medium flex justify-start ">
										{selectedUser?.name}
									</h3>
									<p
										className={`text-sm text-base-content/70 flex justify-start ${
											onlineUsers.includes(selectedUser.id.toString())
												? "text-green-600 px-1 rounded"
												: ""
										}`}
									>
										{onlineUsers.includes(selectedUser?.id?.toString())
											? "Online"
											: "Offline"}
									</p>
								</div>
							</div>
						</div>
					</label>
					{/* Close button */}
				</div>
				<div className="flex w-3/4 justify-center">
					{!selectedUser?.is_contact ? (
						<div role="alert" className="alert pt-1.5 pb-1.5">
							<span className="text-sm">
								New message request – this user is not in your contacts.
							</span>
							<div className="flex justify-self-center">
								<button
									onClick={handleAdd}
									className="btn btn-sm btn-success mx-3 "
								>
									Accept
								</button>
								<button className="btn btn-sm btn-error mx-3">Block</button>
							</div>
						</div>
					) : (
						""
					)}
				</div>
			</div>

			<input type="checkbox" id="my_modal_7" className="modal-toggle " />
			<div className="modal" role="dialog">
				<div className="modal-box h-5/6 w-full ">
					{/* Modal */}

					<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
						<div className="bg-base-100 rounded-xl p-3 space-y-4 max-w-md w-full relative">
							<label
								htmlFor="my_modal_7"
								className="btn btn-sm btn-circle absolute right-2 top-2"
							>
								✕
							</label>
							<div className="text-center">
								<h1 className="text-xl font-semibold">Profile</h1>
								<p className="mt-1">
									{selectedUser?.name || "Contact"} profile information
								</p>
							</div>

							{/* Avatar */}
							<div className="flex flex-col items-center justify-center gap-2 w-24 h-24 mx-auto">
								<div className="relative">
									<img
										src={
											userPics.length > 0
												? userPics[0].profile_url
												: "/avatar.png"
										}
										alt="Profile"
										className="w-24 h-24 rounded-full object-cover border-2 cursor-pointer"
										onClick={() => slides.length > 0 && setLightboxOpen(true)}
									/>
								</div>
							</div>

							{/* Details */}
							<div className="space-y-4">
								<div className="space-y-1.5">
									<div className="text-sm text-zinc-400 flex items-center gap-2">
										<User className="w-4 h-4" />
										Full Name
									</div>
									<p className=" text-md px-4 py-1.5 bg-base-200 rounded-lg border">
										{selectedUser?.name ?? ""}
									</p>
								</div>
								<div className="space-y-1.5">
									<div className="text-sm text-zinc-400 flex items-center gap-2">
										<User className="w-4 h-4" />
										Username
									</div>
									<p className=" text-md px-4 py-1.5 bg-base-200 rounded-lg border">
										{selectedUser?.username ?? ""}
									</p>
								</div>

								<div className="space-y-1.5">
									<div className="text-sm text-zinc-400 flex items-center gap-2">
										<Mail className="w-4 h-4" />
										Email Address
									</div>
									<p className=" text-md px-4 py-1.5 bg-base-200 rounded-lg border">
										{selectedUser?.email ?? ""}
									</p>
								</div>
								<div className="space-y-1.5">
									<div className="text-sm text-zinc-400 flex items-center gap-2">
										<Contact className="w-4 h-4" />
										Phone number
									</div>
									<p className=" text-md px-4 py-1.5 bg-base-200 rounded-lg border">
										{selectedUser?.number || "No data"}
									</p>
								</div>
								<div className="flex justify-start">
									<button
										onClick={deleteContact}
										className="btn btn-sm btn-error "
									>
										Delete contact
									</button>
								</div>
							</div>
						</div>
					</div>
				</div>
				<label className="modal-backdrop" htmlFor="my_modal_7">
					Close
				</label>

				{/* Lightbox for multiple profile pictures */}
				{slides.length > 0 && (
					<Lightbox
						open={lightboxOpen}
						close={() => setLightboxOpen(false)}
						slides={slides}
						plugins={[Counter]}
					/>
				)}
			</div>
		</>
	);
};

export default ChatHeader;
