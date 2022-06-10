import { useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Modal } from "../../../context/Modal";
import ServerEditModal from "./ServerEditModal";

const HomeContent = () => {
  //react
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const { pathname } = useLocation();

  // redux
  const servers = useSelector((state) => Object.values(state.servers));

  // finds server based on url params id
  const currServer = servers?.find(
    (server) => server.id === parseInt(pathname.split("/").pop())
  );

  const openMenu = () => {
    if (showDropdown) return;
    setShowDropdown(true);
  };

  useEffect(() => {
    if (!showDropdown) return;

    const closeMenu = () => {
      setShowDropdown(false);
    };

    document.addEventListener("click", closeMenu);

    return () => document.removeEventListener("click", closeMenu);
  }, [showDropdown]);

  return (
    <div className="home-content-container">
      {pathname === "/channels/@me" ? (
        <div>
          <nav></nav>
        </div>
      ) : (
        <div className="server-sidebar-container">
          <nav>
            <div className="server-name-div">
              <h4>{currServer?.name}</h4>
              <button
                id="server-name-div-button"
                onClick={() => setShowDropdown(true)}
              >
                {showDropdown ? (
                  <>
                  <i className="fa-solid fa-xmark"></i>
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-angle-down"></i>
                  </>
                )}
              </button>

              {showEditModal && (
                <div>
                  <Modal onClose={() => setShowEditModal(false)}>
                    <ServerEditModal />
                  </Modal>
                </div>
              )}
            </div>
            {showDropdown && (
              <div className="dropdown-container">
                <ul id="profile-dropdown-nav">
                  <li>
                    <button onClick={() => setShowEditModal(true)}>
                      <p>Server Settings</p>
                      <i className="fa-solid fa-gear"></i>
                    </button>
                  </li>
                </ul>
              </div>
            )}
            <div className="channel-list-div">Channels</div>
            <div className="server-nav-bottom"></div>
          </nav>
          <div className="server-userinfo-div">
            <h3>User Info</h3>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomeContent;
