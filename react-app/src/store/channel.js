const ADD_CHANNEL = "channels/addChannel";
const LOAD_CHANNELS = "channels/loadChannels";
const REMOVE_CHANNEL = "channels/removeChannel";

const loadChannels = (channels) => {
  return {
    type: LOAD_CHANNELS,
    payload: channels
  };
};

const addChannel = (channel) => {
  return {
    type: ADD_CHANNEL,
    payload: channel
  };
};

const removeChannel = (channel) => {
  return {
    type: REMOVE_CHANNEL,
    payload: channel
  };
};

export const genChannels = () => async (dispatch) => {
  // doing it this way in case we want more types of responses here later ...
  const [channelsResponse] = await Promise.all([fetch(`/api/channels/`)]);
  const [channels] = await Promise.all([channelsResponse.json()]);

  if (channelsResponse.ok) {
    dispatch(loadChannels(channels.channels));
    return channels;
  }
};

export const createChannel = (payload) => async (dispatch) => {
  const { name, description, server_id} = payload;
  const f = new FormData();
  f.append("name", name);
  f.append("description", description);
  f.append("server_id", server_id);

  const [response] = await Promise.all([
    fetch(`/api/channels/`, {
      method: "POST",
      body: f,
    }),
  ]);

  // console.log(estateData);
  if (response.ok) {
    const data = await response.json();
    dispatch(addChannel(data));
    return data;
  } else if (response.status < 500) {
    const data = await response.json();

    if (data.errors) {

      let errorObjArr = {};
      data.errors.forEach((error) => {
        const errorObj = {};
        let key = error.split(":")[0];
        errorObjArr[key] = error.split(":")[1];
      });
      return {'errors': errorObjArr};
    }
  } else {
    return ["An error occurred. Please try again."];
  }
};

export const editChannel = (data) => async (dispatch) => {

  const { id, name, description, server_id} = data;


  const f = new FormData();

  f.append("name", name);
  f.append('description', description)
  f.append('server_id', server_id)

  const [response] = await Promise.all([
    fetch(`/api/channels/${id}`, {
      method: "PATCH",
      body: f,
    }),
  ]);

  if (response.ok) {
    const data = await response.json();
    dispatch(addChannel(data));
    return data;
  } else if (response.status < 500) {
    const data = await response.json();

    if (data.errors) {

      let errorObjArr = [];
      data.errors.forEach((error) => {
        const errorObj = {};
        let key = error.split(":")[0];
        errorObj[key] = error.split(":")[1];
        errorObjArr.push(errorObj);
      });
      return {'errors': errorObjArr};
    }
  } else {
    return ["An error occurred. Please try again."];
  }
};

export const deleteChannel = (channel) => async (dispatch) => {
  const { id } = channel;
  // console.log('inside the thunk');
  // console.log('estateowner', estate.owner_id);
  // console.log("estateid", estate.id);
  // console.log(channel, "=============");
  const response = await fetch(`/api/channels/${id}`, {
    method: "DELETE",
  });
  if (response.ok) {
    const data = await response.json();
    dispatch(removeChannel(data));
    return data;
  } else if (response.status < 500) {
    const data = await response.json();

    if (data.errors) {

      let errorObjArr = [];
      data.errors.forEach((error) => {
        const errorObj = {};
        let key = error.split(":")[0];
        errorObj[key] = error.split(":")[1];
        errorObjArr.push(errorObj);
      });
      return {'errors': errorObjArr};
    }
  } else {
    return ["An error occurred. Please try again."];
  }
};

const channelReducer = (state = {}, action) => {
  switch (action.type) {
    case ADD_CHANNEL:
      return { ...state, [action.payload.id]: action.payload };
    case REMOVE_CHANNEL:
      const copyState = { ...state };
      delete copyState[action.payload.id];
      return copyState;
    case LOAD_CHANNELS:
      const channelData = {};
      for (let channel of action.payload) {
        channelData[channel.id] = channel;
      }
      return { ...channelData };
    default:
      return state;
  }
};

export default channelReducer;
