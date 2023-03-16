import { createUseStyles, useTheme } from "react-jss";
import {useSelector} from "react-redux"

import EllipsesEditButton from "./EditButtons/EllipsesEditButton";
import EditMessageButton from "./EditButtons/EditMessageButton"

const useStyles = createUseStyles((theme) => ({
  buttons: {
    position: "relative",
    boxShadow: `${theme.boxShadowButton} 0px 0px 0px 1px`,
    width: "fit-content",
    display: 'flex'
  },
  editButtonsWrapper: {
    position: "absolute",
    right: "8px",
    top: "-10px",
    zIndex: "1",
    backgroundColor: theme.chatBackground
  },
}));

const DirectMessageEditButtons = ({setEditButtons, socket, message }) => {
  const theme = useTheme();
  const classes = useStyles({ theme });

  const sessionUser = useSelector(state=>(state.session.user))

  return (
    <div className={classes.editButtonsWrapper}>
      <div className={classes.buttons}>
    {message.owner_id === sessionUser.id && (

        <EditMessageButton  {...{setEditButtons}}  {...{ message }} />
    )}
        <EllipsesEditButton {...{setEditButtons}} {...{ message }} />
      </div>
    </div>
  );
};

export default DirectMessageEditButtons;
