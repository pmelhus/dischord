import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { editUserProfile } from "../../../../store/session";
import { Modal } from "../../../../context/Modal";
import PasswordModal from "./PasswordModal";

const EditProfileForm = ({ setEditModal }) => {
  const user = useSelector((state) => state.session.user);

  const [username, setUsername] = useState(user.username);
  const [email, setEmail] = useState(user.email);
  const [bio, setBio] = useState(user.bio);
  const [image, setImage] = useState();
  const [preview, setPreview] = useState(user?.image_url);

  const [errors, setErrors] = useState({});
  const [passwordModal, setPasswordModal] = useState(false);
  const dispatch = useDispatch();

  const updateImage = (e) => {
    const file = e.target.files[0];
    setImage(file);
  };

  const handleEditProfile = async (e) => {
    e.preventDefault();
    const id = user.id;
    const payload = {
      id,
      username,
      email,
      bio,
      image,
    };

    const editedUser = await dispatch(editUserProfile(payload));
    if (editedUser.errors) {
      setErrors(editedUser.errors);
      return;
    } else {
      setEditModal(false);
    }
  };

  const handlePasswordModal = (e) => {

    e.preventDefault();
    // setEditModal(false)
    setPasswordModal(!passwordModal);
  };

  useEffect(() => {
    if (!user.image_url && !image) {
      setPreview(undefined);
      return;
    }

    if (user.image_url && !image) {
      setPreview(user.image_url);
    }

    if (user.image_url && image) {
      const objectUrl = URL.createObjectURL(image);
      setPreview(objectUrl);

      return () => URL.revokeObjectURL(objectUrl);
    }

    // free memory when ever this component is unmounted
  }, [image, user]);

  return (
    <div>
      <form>
        <div>
          <label>Username</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          ></input>
        </div>
        <div>
          <label>Email</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          ></input>
        </div>
        <div>
          <label>Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          ></textarea>
        </div>
        <div id="user-picture-preview">
          <h4>Profile picture preview</h4>
          <img alt="current profile" src={preview} />
        </div>
        <div>
          <label>Profile image upload</label>
          <input type="file" accept="image/*" onChange={updateImage}></input>
        </div>
        {Object.keys(errors).length > 0 && (
          <div className="form-errors">
            {Object.keys(errors).map(
              // (key) => `${errors[key]}`
              (key) => `${errors[key]}`
            )}
          </div>
        )}
        <button onClick={handleEditProfile}>Save Changes</button>
        <button onClick={handlePasswordModal}>Change your password</button>
      </form>
      {passwordModal && (
        // <Modal onClose={setPasswordModal(false)}>
          <PasswordModal {...{ user }} {...{ setPasswordModal }} {...{setEditModal}} />
        // </Modal>
      )}
    </div>
  );
};

export default EditProfileForm;
