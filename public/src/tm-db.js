import { db } from './tm-firebase-config.js';
import { ref, set, onValue, push } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";

export const updateTokenPosition = async (campaignId, tokenId, pos) => {
  const tokenRef = ref(db, `campaigns/${campaignId}/tokens/${tokenId}`);
  await set(tokenRef, pos);
};

export const streamTokens = (campaignId, callback) => {
  const tokensRef = ref(db, `campaigns/${campaignId}/tokens`);
  onValue(tokensRef, (snapshot) => {
    callback(snapshot.val());
  });
};

export const pushChatMessage = async (campaignId, messageData) => {
  const chatRef = ref(db, `campaigns/${campaignId}/chat`);
  await push(chatRef, messageData);
};

export const streamChatMessages = (campaignId, callback) => {
  const chatRef = ref(db, `campaigns/${campaignId}/chat`);
  onValue(chatRef, (snapshot) => {
    callback(snapshot.val());
  });
};
