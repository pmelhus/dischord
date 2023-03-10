import DirectMessage from "./DirectMessage";
import SlateTextEditor from "../../SlateTextEditor";
import { useState, useRef, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useLocation } from "react-router-dom";
import { createUseStyles, useTheme } from "react-jss";
import { createDirectMessage } from "../../../../../store/directMessage";
import FadeIn from "react-fade-in";

const useStyles = createUseStyles((theme) => ({
  slateEditor: {
    backgroundColor: "#4a51577c",
    margin: "8px 14px",
    borderRadius: "10px",
  },
  container: {
    backgroundColor: "#36393f",
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "space-between",

    height: "calc(100% - 15px)",
    maxHeight: "calc(100% - 55px)",
  },
  messages: {
    width: "100%",
    height: "100%",
    display: "flex",
    overflowY: "scroll",
    overflowX: "hidden",
    flexDirection: "column",
    scrollbarWidth: "none",
    marginTop: "14px",
  },
  originAvatar: {
    width: "80px",
    height: "80px",
    objectFit: "cover",
    borderRadius: "100%",
  },
  originDiv: {
    margin: "16px",
  },
  originHeading: {
    margin: "8px 0",
    color: theme.offWhite,
  },
  originText: {
    color: theme.textGray,
    display: "inline",
  },
  usernameText: {
    fontWeight: "bold",
    color: theme.textGray,
    display: "inline",
  },
  buttonContainer: {
    marginTop: "16px",
  },
  directMessagesContainer: {
    position: "relative",
    flexShrink: "0",
    minHeight: "20px",
    height: "fit-content",
    flexBasis: "auto",
    width: "100%",
  },
}));

const DirectMessageConversation = ({ socket }) => {
  const theme = useTheme();
  const classes = useStyles({ theme });

  const alignToTop = false;

  const dispatch = useDispatch();

  const sessionUser = useSelector((state) => state.session.user);
  const users = useSelector((state) => state.users);

  const { pathname } = useLocation();

  const [chatInput, setChatInput] = useState("");

  const uuid = pathname.split("/")[3];

  const inboxes = useSelector((state) => Object.values(state.inboxes));

  const currInbox = inboxes.find((inbox) => inbox.uuid === uuid);

  const [errors, setErrors] = useState({});
  const [isSent, setIsSent] = useState(false);

  const bottomRef = useRef(null);

  const scrollToBottom = () => {
    if (isSent) {
    }
  };

  const sendChat = async () => {
    const sentMessage = await dispatch(
      createDirectMessage({
        user_id: sessionUser.id,
        msg: chatInput,
        inbox_id: currInbox?.id,
      })
    );
    if (sentMessage && sentMessage.errors) {
      await setErrors(sentMessage.errors);
      return;
    }
    // console.log(sentMessage, "SENT MESSAGE");
    await socket?.emit("dmChat", sentMessage.owner_id, currInbox?.id);
    await setIsSent(true);
    // await socket?.emit("timeout_user");
    // await setErrors({})
    // clear the input field after the message is sent
    await setErrors({});
    await setChatInput("");
  };

  const directMessages = useSelector((state) =>
    Object.values(state.directMessages)
  );
  const inboxDms = directMessages.filter(
    (message) => message.inbox_id === currInbox?.id
  );

  // function to determine who is who in inbox

  const determineId = () => {
    let friendId = null;
    currInbox?.inbox_members.forEach((id) => {
      if (id !== sessionUser.id) {
        friendId = id;
      }
    });
    return friendId;
  };
  const otherUser = users[determineId()];



  useEffect(() => {
    bottomRef.current?.scrollIntoView({behavior:'smooth', block:'end'});
  }, [pathname, inboxDms]);

  const handleDelete = (message) => {};

  return (
    <div className={classes.container}>
      <div className={classes.messages}>
        <div className={classes.originDiv}>
          <img
            className={classes.originAvatar}
            src={otherUser?.image_url}
          ></img>
          <h1 className={classes.originHeading}>{otherUser?.username}</h1>
          <div>
            <p className={classes.originText}>
              This is the beginning of your direct message history with{" "}
            </p>
            <p className={classes.usernameText}>@{otherUser?.username}</p>
            <div className={classes.buttonContainer}>
              <button onClick={handleDelete}>Remove Friend</button>
            </div>
          </div>
        </div>
        {inboxDms.map((message, ind) => (
          <FadeIn>
            <div key={ind} className={classes.directMessagesContainer}>
              <DirectMessage
                {...{ socket }}
                {...{ message }}
                {...{ ind }}
                {...{ chatInput }}
                {...{ currInbox }}
                {...{ inboxDms }}
              />
            </div>
          </FadeIn>
        ))}
        <div style={{ height: "1px" }} ref={bottomRef}></div>
      </div>
      <div className={classes.slateEditor}>
        <SlateTextEditor
          {...{ sendChat }}
          placeholder={`Message `}
          {...{ chatInput }}
          {...{ setChatInput }}
        />
      </div>
    </div>
  );
};
export default DirectMessageConversation;
