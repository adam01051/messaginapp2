import { useChatStore } from "../store/useChatStore";
import { useEffect, useRef } from "react";

import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";


import Zoom from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";


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


	useEffect(() => {
		const handleEsc = (e) => {
			const modalCheckbox = document.getElementById("my_modal_7");
			if (e.key !== "Escape") return;

			if (modalCheckbox && modalCheckbox.checked) {
				// If modal is open, close it
				modalCheckbox.checked = false;
			} else {
				// Otherwise, close chat container
				closeChat();
			}


		};
		document.addEventListener("keydown", handleEsc);
		return () => document.removeEventListener("keydown", handleEsc);
	}, [closeChat]);


	const { authUser } = useAuthStore();
	const messageEndRef = useRef(null);
	
	useEffect(() => {
		getMessages(selectedUser.id);

		subscribeToMessages();

		return () => unsubscribeFromMessages();
	}, [
		selectedUser.id,
		getMessages,
		subscribeToMessages,
		unsubscribeFromMessages,
	]);

	
	useEffect(() => {
		if (messageEndRef.current && messages) {
			messageEndRef.current.scrollIntoView({ behavior: "smooth" });
		}
	}, [messages]);

	if (!authUser || isMessagesLoading) {
		return (
			<div id="chat" className="  flex-1 flex flex-col overflow-auto">
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
				{messages.map((message) => (
					<div
						key={message.id}
						className={`chat ${
							String(message.sender_id) === String(authUser.id)
								? "chat-end"
								: "chat-start"
						}`}
						ref={messageEndRef}
					>
						<div className=" chat-image avatar">
							<div className="size-10 rounded-full border">
								<img
									src={
										String(message.sender_id) === String(authUser.id)
											? authUser.profileimage || "/avatar.png"
											: selectedUser.profileimage || "/avatar.png"
									}
									alt="profile pic"
								/>
							</div>
						</div>
						<div className="chat-header mb-1">
							<time className="text-xs opacity-50 ml-1">
								{formatMessageTime(message.created_at)}
							</time>
						</div>
						<div className="chat-bubble flex flex-col">
							{  message.image && (
								<Zoom>
									<img
										src={message.image}
										alt="Attachment"
										className="sm:max-w-[200px] rounded-md mb-2"
									/>
								</Zoom>
							)}
							{message.content && <p>{message.content}</p>}
						</div>
					</div>
				))}
			</div>

			<MessageInput />
		</div>
	);
};
export default ChatContainer;
/*
<button className="btn" onClick={()=>document.getElementById('my_modal_2').showModal()}>open modal</button>
<dialog id="my_modal_2" className="modal">
  <div className="modal-box">
    <h3 className="font-bold text-lg">Hello!</h3>
    <p className="py-4">Press ESC key or click outside to close</p>
  </div>
  <form method="dialog" className="modal-backdrop">
    <button>close</button>
  </form>
</dialog>*/