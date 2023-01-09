// import the socket

import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useLocation, Route } from "react-router-dom";
import {
  createChannelMessage,
  genChannelMessages,
} from "../../../store/channelMessage";
import ChannelMessage from "./ChannelMessage";
import LoadingScreen from "../../LoadingScreen";
import { LoadingModal } from "../../../context/LoadingModal";
import UserOnlineCard from "./UserOnlineCard";
import UserOfflineCard from "./UserOfflineCard";

import MePage from "./MePage/MePage";
// outside of your component, initialize the socket variable

const Chat = ({ socket }) => {
  // use state for controlled form input
  const [chatInput, setChatInput] = useState("");
  const dispatch = useDispatch();
  const user = useSelector((state) => state.session.user);
  const { pathname } = useLocation();
  const url = pathname.split("/")[2];
  const channelId = parseInt(pathname.split("/")[3]);
  const serverId = parseInt(pathname.split("/")[2]);
  const [isSent, setIsSent] = useState(false);
  const currentChannel = useSelector((state) => state.channels[channelId]);
  const allChannelMessages = useSelector((state) =>
    Object.values(state.channelMessages)
  );
  const [errors, setErrors] = useState({});
  const users = useSelector((state) => Object.values(state.users));

  const currentChannelMessages = allChannelMessages.filter(
    (message) => message.channel_id === channelId
  );
  const currentServer = useSelector((state) => state.servers[serverId]);
  const [messageError, setMessageError] = useState(true);
  const [messageEditId, setMessageEditId] = useState(null);

  const updateChatInput = (e) => {
    setChatInput(e.target.value);
  };

  const inactiveTimer = (socket, id) => {
    setTimeout(() => {
      socket?.emit("change_inactive", id);
    }, "3600000");
  };

  const sendChat = async (e) => {
    e.preventDefault();

    const sentMessage = await dispatch(
      createChannelMessage({
        user_id: user.id,
        msg: chatInput,
        channel_id: channelId,
      })
    );
    if (sentMessage && sentMessage.errors) {
      await setErrors(sentMessage.errors);
      return;
    }
    console.log(sentMessage, "SENT MESSAGE");
    await socket?.emit("chat", sentMessage.owner_id);
    // await socket?.emit('change_inactive', sentMessage.owner_id)
    await socket?.emit("timeout_user");
    // await setErrors({})
    await setIsSent(true);

    // clear the input field after the message is sent
    await setErrors({});
    await setChatInput("");
    await inactiveTimer(socket, sentMessage.owner_id);
  };

  useEffect(() => {
    genChannelMessages();
  }, [pathname]);

  let online = [];
  let offline = [];

  // Places all server member ids in an array
  let serverMembersArr = [];
  if (currentServer) {
    currentServer.members_ids?.forEach((member) => {
      // console.log(member, "member")
      serverMembersArr.push(member.user_id);
    });
  }

  users.map((user) => {
    if (serverMembersArr?.includes(user.id)) {
      if (user.online) {
        online.push(user);
      } else {
        offline.push(user);
      }
    }
  });

  // const onlineServerMembers = users.filter()

  // console.log(serverMembersArr, 'CURRENT SERVER HERE')

  useEffect(() => {
    setMessageError(true);
    if (chatInput.length < 1001) {
      setMessageError(false);
    }
  }, [chatInput]);

  return (
    <div className="chat-container">
      <div className="channel-chat-container">
        {/* <div className="channel-chat-and-send-form"> */}
        <div className="channel-chat-messages">
          <Route exact path="/channels/@me">
            <MePage />
          </Route>
          <Route exact path={`/channels/${serverId}/noChannels`}>
            <div className="no-channels-container">
              <div className="no-channels-div">
                <h1>Wow, such empty...</h1>
                <h3>Looks like this server has no channels!</h3>
                <h3>
                  If you're the creator of this server, you can add channels by
                  clicking the " <i className="fa-solid fa-plus fa-lg"></i> "
                  next to " Text Channels "
                </h3>
              </div>
            </div>
          </Route>
          {currentChannelMessages.reverse().map((message, ind) => (
            <div className="channel-message-div" key={ind}>
              <ChannelMessage
                {...{ setMessageEditId }}
                {...{ messageEditId }}
                {...{ channelId }}
                {...{ socket }}
                {...{ message }}
                {...{ ind }}
              />
            </div>
          ))}
        </div>
        <div className="channel-chat-form-div">
          {pathname.split("/")[2] !== "@me" &&
            pathname.split("/")[3] !== "noChannels" && (
              <>
                {errors && messageError && errors.content && (
                  <div className="error-msg-message">
                    <p>*{errors.content}*</p>
                  </div>
                )}
                <form className="channel-chat-form" onSubmit={sendChat}>
                  <input
                    id="channel-chat-input"
                    value={chatInput}
                    placeholder={
                      currentChannel?.name
                        ? `Message ${currentChannel?.name}`
                        : ""
                    }
                    onChange={updateChatInput}
                  />
                  {/* <button type="submit">Send</button> */}
                </form>
              </>
            )}
        </div>
        {/* </div> */}
      </div>
      <div className="server-members">
        {/* <div className="server-members-list"> */}
        <div className="server-members-online">
          {url !== "@me" && (
            <h4 className="server-members-titles">Online - {online.length}</h4>
          )}
          {users &&
            users.map((user) => {
              if (serverMembersArr?.includes(user.id)) {
                return (
                  <>
                    {user.online && (
                      <>
                        <UserOnlineCard
                          {...{ online }}
                          {...{ currentServer }}
                          {...{ serverMembersArr }}
                          {...{ user }}
                        />
                      </>
                    )}
                  </>
                );
              }
            })}
          {url !== "@me" && (
            <p className="server-members-titles">Offline - {offline.length}</p>
          )}
          {users &&
            users.map((user) => {
              if (serverMembersArr?.includes(user.id)) {
                return (
                  <>
                    {!user.online && (
                      <>
                        <UserOfflineCard
                          {...{ currentServer }}
                          {...{ serverMembersArr }}
                          {...{ user }}
                        />
                      </>
                    )}
                  </>
                );
              }
            })}
        </div>
        {/* </div> */}
      </div>
    </div>
  );
};

export default Chat;
