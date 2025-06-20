// Hathora removed. Replace room functions with local stubs.

export async function updateRoomConfig(config: any, roomId: string) {
  // No-op stub
  return { statusCode: 200 };
}

export async function getRoomInfo(roomId: string) {
  // Return a stub room config for any roomId
  return {
    roomConfig: JSON.stringify({
      winningScore: 10,
      capacity: 8,
      numberOfPlayers: 0,
      roomName: roomId,
    }),
  };
}

export async function destroyRoom(roomId: string) {
  // No-op stub
  return;
}
