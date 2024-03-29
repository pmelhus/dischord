import { useDispatch, useSelector } from "react-redux";
import { createUseStyles, useTheme } from "react-jss";
import { loadAllFriends } from "../../../../../store/friend";
import {
  createInbox,
  addInboxMembers,
  getOneInbox,
} from "../../../../../store/inbox";
import { useHistory } from "react-router-dom";
import { useState } from "react";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";
import sadFish from "../../../../../images/newsadfish.png";

const useStyles = createUseStyles((theme) => ({
  avatar: {
    width: "40px",
    height: "40px",
    objectFit: "cover",
    borderRadius: "100%",
  },
  heading: {
    color: theme.textGray,
    fontSize: "12px",
    fontWeight: "550",
    margin: "16px 20px 8px 30px",
  },

  pendingOutgoingList: {},
  avatar: {
    width: "32px",
    height: "32px",
    objectFit: "cover",
    borderRadius: "100%",
  },
  divider: {
    width: "96%",
    height: "1px",
    // margin: "0 8px",
    backgroundColor: theme.textGrayTrans,
    marginLeft: "30px",
    marginRight: "20px",
  },
  outgoingCard: {
    marginLeft: "30px",
    marginRight: "20px",
    display: "flex",
    alignItems: "center",
    padding: "10px 0",
    paddingRight: "25px",
    justifyContent: "space-between",
  },
  imageAndText: {
    display: "flex",
    alignItems: "center",
  },
  cancelRequest: {
    cursor: "pointer",
    marginLeft: "5px",
    "&:hover": { backgroundColor: "darkred", borderRadius: "100%" },
  },
  acceptRequest: {
    cursor: "pointer",
    "&:hover": { backgroundColor: "darkgreen", borderRadius: "100%" },
  },
  messageFriend: {
    color: theme.textGray,
    backgroundColor: theme.darkInputBackground,
    cursor: "pointer",
    borderRadius: "100%",
    width: "30px",
    height: "30px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  sadFishy: {
    width: "200px",
    height: "200px",
    objectFit: "cover",
    paddingBottom: "30px",
  },
  fishDiv: {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    flexDirection: "column",
    justifyContent: "center",
    color: theme.darkGray,
    paddingRight: "40px",
  },
}));

const FriendsList = () => {
  const theme = useTheme();
  const classes = useStyles({ theme });

  const dispatch = useDispatch();
  const friendsList = useSelector((state) =>
    Object.values(state.friends.friendships)
  );
  const users = useSelector((state) => state.users);
  const sessionUser = useSelector((state) => state.session.user);
  const [errors, setErrors] = useState({});

  // function to determine whether user is friend_id or self_id

  const determineId = (friend) => {
    if (sessionUser.id === friend.friend_id) {
      return friend.self_id;
    }
    if (sessionUser.id === friend.self_id) {
      return friend.friend_id;
    }
  };

  const history = useHistory();
  // function that pushes new url to direct messages of friend if there is an existing inbox
  // if there isnt an existing inbox, then a new inbox is created and then user gets pushed to the new inbox url

  const handleDmChat = async (friend) => {
    const { self_id, friend_id } = friend;

    const payload = { self_id, friend_id };

    const existingInbox = await dispatch(getOneInbox(payload));
    if (existingInbox.errors) {
      const createdInbox = await dispatch(createInbox(payload));
      if (createdInbox && createdInbox.errors) {
        await setErrors(createdInbox.errors);
      }

      const inbox_id = createdInbox.inbox.id;
      const memberPayload = { self_id, friend_id, inbox_id };
      const addedInboxMembers = await dispatch(addInboxMembers(memberPayload));
      if (addedInboxMembers.errors) {
        await setErrors(addedInboxMembers.errors);
      }

      return await history.push(`/channels/@me/${createdInbox.inbox.uuid}`);
    }

    return await history.push(`/channels/@me/${existingInbox.uuid}`);
  };

  const tooltip = (
    <Tooltip placement="top" id="tooltip-top">
      <div className={classes.buttonNameContainer}>
        <div className={classes.tooltipText}>Message</div>
      </div>
    </Tooltip>
  );

  const friendTooltip = (
    <Tooltip placement="bottom" id="tooltip-top">
      <div className={classes.buttonNameContainer}>
        <div className={classes.tooltipText}>Add a friend</div>
      </div>
    </Tooltip>
  );

  const popperConfig = {
    modifiers: [
      {
        name: "offset",
        options: {
          offset: [0, 6], // set margin-top to 10px
        },
      },
    ],
  };

  return (
    <>
      <div className={classes.heading}>
        <h4
          style={{ fontSize: "12px" }}
        >{`ALL FRIENDS - ${friendsList.length}`}</h4>
      </div>
      {!friendsList.length && (
        <div className={classes.fishDiv}>
          <img className={classes.sadFishy} src={sadFish}></img>
          <p>No one's around to play with Goldie...</p>
        </div>
      )}
      {friendsList.map((friend) => {
        const currFriend = users[determineId(friend)];
        return (
          <>
            <div className={classes.cardContainer}>
              <div key={friend.id} className={classes.divider}></div>
              <div className={classes.outgoingCard}>
                <div className={classes.imageAndText}>
                  <div>
                    <img
                      className={classes.avatar}
                      src={currFriend?.image_url}
                    ></img>
                  </div>
                  <div style={{ paddingLeft: "10px" }}>
                    <div>
                      <h3 style={{ color: theme.offWhite }}>
                        {currFriend?.username}
                      </h3>
                      {/* <p style={{ fontSize: "11px", color: theme.textGray }}>
                        Incoming Friend Request
                      </p> */}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex" }}>
                  <OverlayTrigger
                    trigger={["focus", "hover"]}
                    placement="top"
                    overlay={tooltip}
                    popperConfig={popperConfig}
                  >
                    <div
                      onClick={() => handleDmChat(friend)}
                      className={classes.messageFriend}
                    >
                      <i className="fa-solid fa-message"></i>
                    </div>
                  </OverlayTrigger>
                </div>
              </div>
            </div>
          </>
        );
      })}
    </>
  );
};

export default FriendsList;
