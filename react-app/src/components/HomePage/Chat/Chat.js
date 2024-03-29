// import the socket

import { createUseStyles, useTheme } from "react-jss";
import { useState, useEffect, useRef, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useLocation, Route, Switch } from "react-router-dom";
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
import Placeholder from "../../Placeholders/Placeholder";
import FadeIn from "react-fade-in";
import SlateTextEditor from "./SlateTextEditor";
import DirectMessageConversation from "./MePage/DirectMessages/DirectMessageConversation";
import { genDirectMessages } from "../../../store/directMessage";
import InviteUser from "../../HomePage/HomeContent/InviteUser";
import { Modal } from "../../../context/Modal";
import InviteFriendsWelcome from "./InviteFriendsWelcome";
import { loadAllFriends } from "../../../store/friend";

const useStyles = createUseStyles((theme) => ({
  channelChatContainer: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-start",
    minWidth: "100%",
  },
  inviteFriendsWelcome: {
    display: "flex",
    justifyContent: "center",
  },
  channelChatForm: {
    boxSizing: "border-box",
    backgroundColor: "#4a51577c",
    display: "flex",
    alignItems: "center",
    borderRadius: "7px",
    maxHeight: "400px",
    minHeight: "40px",
    overflow: "auto",
    margin: "0px 20px 26px 20px",
  },
  channelChatFormHighlighted: {
    boxSizing: "border-box",
    backgroundColor: "#4a51577c",
    display: "flex",
    alignItems: "center",
    borderRadius: "7px",
    maxHeight: "400px",
    minHeight: "40px",
    overflow: "auto",
    margin: "0px 20px 26px 20px",
    boxShadow: `0 0 0 4px ${theme.messageHighlight}`,
  },
  errorMsg: {
    color: "red",
    position: "absolute",
    bottom: "0px",
  },
  newChannel: {
    padding: '12px'
  },
  channelHash: {
    color: theme.offWhite,
    backgroundColor: theme.hashGray,
    borderRadius: '100%',
    width: '50px',
    height: '50px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  channelWelcome: {
    color: theme.offWhite,
    padding: '4px',
    marginTop: '2px'
  },
  channelWelcomeMessage: {
    color: theme.textGray,
    padding: '4px'
  }
}));

const Chat = ({
  socket,
  selected,
  setSelected,
  setLoadingMessages,
  loadingMessages,
  loaded,
}) => {
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
  const bottomRef = useRef(null);
  const theme = useTheme();
  const classes = useStyles({ theme });

  const sessionUser = useSelector((state) => state.session.user);

  const [inviteModal, setInviteModal] = useState(false);

  // const endOfString = (string) => {
  //   let httpsIndex = string.indexOf("https://");
  //   let httpIndex = string.indexOf("http://");
  //   if (httpsIndex) return string.slice(0, httpsIndex);
  //   if (httpIndex) return string.slice(0, httpIndex);
  // }

  // state for highlighting message field
  const [highlight, setHighlight] = useState(false);

  const sendChat = async () => {
    const sentMessage = await dispatch(
      createChannelMessage({
        user_id: user.id,
        msg: chatInput,
        channel_id: channelId,
      })
    );
    if (sentMessage.errors) {
      await setErrors(sentMessage.errors);
      return { errors: sentMessage.errors };
    } else {
      await socket?.emit("chat", sentMessage.owner_id);

      // await setErrors({})
      await setIsSent(true);
      await bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      // clear the input field after the message is sent
      await setErrors({});
      await setChatInput("");
      return false;
    }
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

  useEffect(() => {
    setMessageError(true);
    if (chatInput.length < 1001) {
      setMessageError(false);
    }
  }, [chatInput]);

  const uuid = pathname.split("/")[3];

  const inboxes = useSelector((state) => Object.values(state.inboxes));

  const currInbox = inboxes.find((inbox) => inbox.uuid === uuid);

  const [updateRequests, setUpdateRequests] = useState(false);
  const [requestLoaded, setRequestLoaded] = useState(false);

  useEffect(() => {
    if (uuid && currInbox) {
      dispatch(genDirectMessages(currInbox.id));
    }
  }, []);

  useEffect(async () => {
    if (uuid && currInbox) {
      await setLoadingMessages(true);
      await dispatch(genDirectMessages(currInbox.id));
      await setLoadingMessages(false);
    }
  }, [pathname]);

  const handleClick = () => {
    setHighlight(false);
  };

  useEffect(() => {
    if (highlight) {
      window.addEventListener("click", handleClick);
      return () => {
        window.removeEventListener("click", handleClick);
      };
    }
  }, [highlight]);

  useEffect(async () => {
    await dispatch(loadAllFriends(sessionUser.id));
    await setRequestLoaded(true);
  }, [dispatch]);

  return (
    <>
      <Switch>
        <Route path="/channels/@me/*">
          {requestLoaded && (
            <DirectMessageConversation
              {...{ setLoadingMessages }}
              {...{ loadingMessages }}
              {...{ socket }}
            />
          )}
        </Route>
        <div className="chat-container">
          <div
            className={
              url !== "@me"
                ? "channel-chat-container"
                : classes.channelChatContainer
            }
          >
            <Route exact path="/channels/@me">
              <MePage {...{ loaded }} {...{ selected }} {...{ setSelected }} />
            </Route>

            {/* <div className="channel-chat-and-send-form"> */}
            <Route exact path="/channels/*/*">
              <div className="channel-chat-messages">
                <div>
                  {currentChannel?.name === "general" ? (
                    <div className={classes.inviteFriendsWelcome}>
                      <InviteFriendsWelcome
                        {...{ setHighlight }}
                        {...{ currentServer }}
                        {...{ user }}
                        {...{ setInviteModal }}
                      />
                    </div>
                  ) : (
                    <div className={classes.newChannel}>
                      <div className={classes.channelHash}>
                        <i className="fa-2xl fa-light fa-hashtag"></i>
                      </div>
                      <div className={classes.channelWelcome}>
                      <h1>Welcome to #{currentChannel?.name}!</h1>
                      </div>
                      <div className={classes.channelWelcomeMessage}>
                        <p>This is the start of the #{currentChannel?.name} channel.</p>
                        </div>
                    </div>
                  )}
                  {loadingMessages ? (
                    <div className="channel-message-div-loader">
                      <Placeholder />
                      <Placeholder />
                      <Placeholder />
                    </div>
                  ) : (
                    <>
                      {currentChannelMessages.map((message, ind) => (
                        <FadeIn>
                          <div
                            ref={bottomRef}
                            className="channel-message-div"
                            key={ind}
                          >
                            <ChannelMessage
                              {...{ setMessageEditId }}
                              {...{ messageEditId }}
                              {...{ channelId }}
                              {...{ socket }}
                              {...{ message }}
                              {...{ chatInput }}
                              {...{ currentChannelMessages }}
                              {...{ ind }}
                            />
                          </div>
                        </FadeIn>
                      ))}
                    </>
                  )}
                </div>
              </div>
              {/* <div className={classes.channelChatFormDiv}> */}
              {/* {pathname.split("/")[2] !== "@me" &&
                pathname.split("/")[3] !== "noChannels" && ( */}
              <>
                <form
                  className={
                    highlight
                      ? classes.channelChatFormHighlighted
                      : classes.channelChatForm
                  }
                >
                  <SlateTextEditor
                    {...{ sendChat }}
                    placeholder={`Message ${currentChannel?.name}`}
                    {...{ chatInput }}
                    {...{ setChatInput }}
                    {...{ errors }}
                  />

                  {/* <button type="submit">Send</button> */}
                  {errors && messageError && errors.content && (
                    <div className={classes.errorMsg}>
                      <p>*{errors.content}*</p>
                    </div>
                  )}
                </form>
              </>
              {/* )} */}
              {/* </div> */}
            </Route>
          </div>
          <Route path="/channels/*/*">
            <div className="server-members">
              {/* <div className="server-members-list"> */}
              <div className="server-members-online">
                {url !== "@me" && (
                  <h4 className="server-members-titles">
                    Online - {online.length}
                  </h4>
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
                  <p className="server-members-titles">
                    Offline - {offline.length}
                  </p>
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
          </Route>
        </div>
      </Switch>
      {inviteModal && (
        <Modal onClose={() => setInviteModal(false)}>
          <InviteUser
            {...{ setInviteModal }}
            {...{ socket }}
            {...{ currentServer }}
            {...{ sessionUser }}
          />
        </Modal>
      )}
    </>
  );
};

export default Chat;
