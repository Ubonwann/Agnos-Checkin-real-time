const Pusher = require("pusher");

const STAFF_CHANNEL = "staff-dashboard";
const UPDATE_EVENT = "patient-update";

let pusher;
function getPusher() {
  if (!pusher) {
    pusher = new Pusher({
      appId: process.env.PUSHER_APP_ID,
      key: process.env.PUSHER_KEY,
      secret: process.env.PUSHER_SECRET,
      cluster: process.env.PUSHER_CLUSTER,
      useTLS: true,
    });
  }
  return pusher;
}

/** Broadcasts a session snapshot to every connected staff dashboard. */
async function publishSessionUpdate(session) {
  await getPusher().trigger(STAFF_CHANNEL, UPDATE_EVENT, session);
}

module.exports = { publishSessionUpdate, STAFF_CHANNEL, UPDATE_EVENT };
