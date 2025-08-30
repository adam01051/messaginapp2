import { useChatStore } from "../store/useChatStore";
import { useEffect, useRef, useState } from "react";

import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";

// Lightbox imports
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";

import Counter from "yet-another-react-lightbox/plugins/counter";
import "yet-another-react-lightbox/plugins/counter.css";

const ChatContainer = () => {
	const {
		messages,
		getMessages,
		isMessagesLoading,
		selectedUser,
		subscribeToMessages,
		unsubscribeFromMessages,
		closeChat,
	} = useChatStore();

	const { authUser, profilePics } = useAuthStore();
	const messageEndRef = useRef(null);

	const [lightboxOpen, setLightboxOpen] = useState(false);
	const [slides, setSlides] = useState([]);
	const [userPics, setUserPics] = useState([]);
	const [selectedUserPics, setSelectedUserPics] = useState([]);

	// Escape key to close chat
	useEffect(() => {
		const handleEsc = (e) => {
			if (e.key !== "Escape") return;

			// If Lightbox is open, close it first
			if (lightboxOpen) {
				setLightboxOpen(false);
				return;
			}

			// Otherwise close chat
			closeChat();
		};

		document.addEventListener("keydown", handleEsc);
		return () => document.removeEventListener("keydown", handleEsc);
	}, [closeChat, lightboxOpen]);

	// Fetch messages and subscribe
	useEffect(() => {
		if (!selectedUser?.id) return;
		getMessages(selectedUser.id);
		subscribeToMessages();
		return () => unsubscribeFromMessages();
	}, [selectedUser?.id, subscribeToMessages, getMessages,unsubscribeFromMessages]);

	// Prepare profile pics for both users
	useEffect(() => {
		if (profilePics && authUser) {
			setUserPics(profilePics.filter((pic) => pic.user_ref === authUser.id));
			
		}
		if (profilePics && selectedUser) {
			setSelectedUserPics(
				profilePics.filter((pic) => pic.user_ref === selectedUser.id)
				
			);
			
		}
	}, [profilePics, authUser, selectedUser]);

	// Scroll to bottom on new messages
	useEffect(() => {
		if (messageEndRef.current && messages?.length) {
			messageEndRef.current.scrollIntoView({ behavior: "smooth" });
		}
	}, [messages]);

	const handleAvatarClick = (isAuthUser) => {

		if (isAuthUser && userPics.length > 0) {
			setSlides(userPics.map((pic) => ({ src: pic.profile_url })));
			setLightboxOpen(true);
		} else if (!isAuthUser && selectedUserPics.length > 0) {
			setSlides(selectedUserPics.map((pic) => ({ src: pic.profile_url })));
			setLightboxOpen(true);
		}
	};

	if (!authUser || isMessagesLoading) {
		return (
			<div id="chat" className="flex-1 flex flex-col overflow-auto">
				<ChatHeader />
				<MessageSkeleton />
				<MessageInput />
			</div>
		);
	}

	return (
		<div className="flex-1 flex flex-col overflow-auto">
			<ChatHeader />

			<div className="flex-1 overflow-y-auto p-4 space-y-4">
				{messages.map((message) => {
					const isAuthUserMsg =
						String(message.sender_id) === String(authUser.id);
					return (
						<div
							key={message.id}
							className={`chat ${isAuthUserMsg ? "chat-end" : "chat-start"}`}
							ref={messageEndRef}
						>
							<div className="chat-image avatar">
								<div className="size-10 rounded-full border cursor-pointer">
									<img
										src={
											isAuthUserMsg
												? userPics[0]?.profile_url || "/avatar.png"
												: selectedUserPics[0]?.profile_url || "/avatar.png"
										}
										alt="profile pic"
										onClick={() => handleAvatarClick(isAuthUserMsg)}
									/>
								</div>
							</div>
							<div className="chat-header mb-1">
								<time className="text-xs opacity-50 ml-1">
									{formatMessageTime(message.created_at)}
								</time>
							</div>
							<div className="chat-bubble flex flex-col">
								{message.image && (
									<img
										src={message.image}
										alt="Attachment"
										className="sm:max-w-[200px] rounded-md mb-2"
									/>
								)}
								{message.content && <p>{message.content}</p>}
							</div>
						</div>
					);
				})}
			</div>

			<MessageInput />

			{/* Lightbox */}
			{slides.length > 0 && (
				<Lightbox
					open={lightboxOpen}
					close={() => setLightboxOpen(false)}
					slides={slides}
					plugins={[Counter]}
				/>
			)}
		</div>
	);
};

export default ChatContainer;
