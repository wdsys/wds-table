import io from 'socket.io-client';

const env = import.meta.env.MODE;
let $BASE_URL = window.location.origin;

if (env === 'development') {
  // $BASE_URL = 'https://i.wiseverds.com';
  // $BASE_URL = 'http://192.168.0.17';
  // $BASE_URL = 'http://192.168.100.83:8080'; //114
  $BASE_URL = 'https://dev.wiseverds.com';
}

class SocketManager {
  constructor() {
    if (SocketManager.instance) {
      // eslint-disable-next-line no-constructor-return
      return SocketManager.instance;
    }

    // 单例实例
    SocketManager.instance = this;

    // WebSocket 实例
    this.socket = null;

    // 当前房间 ID
    this.currentRoomId = null;

    this.isConnected = false;

    // 初始化
    this.initSocket();
  }

  // 初始化 WebSocket 连接
  initSocket() {
    this.socket = io(`${$BASE_URL}/AiResponseSocketIo`);

    // 监听连接成功事件
    this.socket.on('connect', () => {
      console.log('Connected to WebSocket server');
      this.isConnected = true;
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
      this.isConnected = false;
    });

    // 监听连接错误事件
    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.isConnected = false;
    });

    // 监听 end 事件，离开房间
    // this.socket.on('messageEnd', () => {
    //   this.leaveRoom();
    // });
  }

  // 添加断开连接方法
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.isConnected = false;
      this.socket = null;
    }
  }

  // 确保连接方法
  async ensureConnection() {
    if (!this.socket || !this.isConnected) {
      this.initSocket();
      // 等待连接建立
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout'));
        }, 5000);

        this.socket.once('connect', () => {
          clearTimeout(timeout);
          resolve();
        });

        this.socket.once('connect_error', (error) => {
          clearTimeout(timeout);
          reject(error);
        });
      });
    }
    return Promise.resolve();
  }

  // 获取 roomId
  // eslint-disable-next-line class-methods-use-this
  //   async getRoomId() {
  //     try {
  //       const response = await fetch('https://your-server-url/api/get-room-id', {
  //         method: 'GET',
  //         headers: {
  //           'Content-Type': 'application/json',
  //         },
  //       });

  //       if (!response.ok) {
  //         throw new Error('Failed to fetch roomId');
  //       }

  //       const data = await response.json();
  //       return data.roomId;
  //     } catch (error) {
  //       console.error('Error fetching roomId:', error);
  //       return null;
  //     }
  //   }

  // 加入房间
  joinRoom(roomId, userId) {
    if (this.currentRoomId) {
      console.warn('Already in a room. Leaving current room:', this.currentRoomId);
      this.leaveRoom();
    }

    this.currentRoomId = roomId;
    this.socket.emit('join', { roomName: roomId, user_id: userId });
    console.log('Joined room:', roomId);
  }

  // 离开房间
  leaveRoom() {
    if (this.currentRoomId) {
      this.socket.emit('messageStop', this.currentRoomId);
      this.socket.emit('leaveRoom', { roomName: this.currentRoomId });
      console.log('Left room:', this.currentRoomId);
      this.currentRoomId = null;
    }
  }

  // 获取 AI 数据
  async getAIData(roomId, userId, onReceived, onEnd, onStart) {
    try {
      // 1. 获取 roomId
      // const roomId = await this.getRoomId();
      if (!roomId) {
        console.error('Failed to get roomId');
        return;
      }

      // 确保连接已建立
      await this.ensureConnection();

      // 2. 加入房间
      this.joinRoom(roomId, userId);

      // 3. 监听 message 事件
      const onMessage = (data) => {
        console.log('Received AI data:', data);
        if (roomId === this.currentRoomId) {
          onReceived(data);
        }
      };

      const onStartMessage = (data) => {
        console.log('Receive data start:', data);
        onStart(data);
      };

      const onInnerEnd = () => {
        console.log('AI data stream ended');
        onEnd();
        this.leaveRoom();
        this.socket.off('result_content', onMessage);
        this.socket.off('messageEnd', onInnerEnd);
      };

      this.socket.once('result_content', onStartMessage);
      this.socket.on('result_content', onMessage);
      this.socket.on('messageEnd', onInnerEnd);
    } catch (e) {
      console.log(e);
    }
  }

  // 获取 AI 数据
  async getPatchAIData(roomIds, userId, onReceived, onEnd, onStart) {
    try {
      // 1. 获取 roomId
      // const roomId = await this.getRoomId();
      if (!roomIds?.length) {
        console.error('Failed to get roomId');
        return;
      }

      // 确保连接已建立
      await this.ensureConnection();

      const roomSet = new Set();
      // 2. 加入房间
      for (const roomId of roomIds) {
        this.socket.emit('join', { roomName: roomId, user_id: userId });
        console.log(roomId, 'roomId join');
        roomSet.add(roomId);
      }

      // 3. 监听 message 事件
      const onMessage = (data) => {
        console.log('Received AI data:', data);
        // if (roomId === this.currentRoomId) {
        //   onReceived(data);
        // }
        onReceived(data);
      };

      const onStartMessage = (data) => {
        console.log('Receive data start:', data);
        onStart(data);
      };

      const onInnerEnd = (data) => {
        console.log('AI data stream ended', data);
        // for (const roomId of roomIds) {
        // this.socket.emit('messageStop', data.room);
        this.socket.emit('leaveRoom', data.room);
        roomSet.delete(data.room);
        if (roomSet.size === 0) {
          onEnd();
          this.disconnect();
        }
        // }
        // this.socket.off('result_content', onMessage);
        // this.socket.off('messageEnd', onInnerEnd);
      };

      const abortListener = () => {
        this.socket?.off?.('result_content', onMessage);
        this.socket?.off?.('messageEnd', onInnerEnd);
      };

      this.socket.once('result_content', onStartMessage);
      this.socket.on('result_content', onMessage);
      this.socket.on('messageEnd', onInnerEnd);

      // eslint-disable-next-line consistent-return
      return abortListener;
    } catch (e) {
      console.log(e);
    }
  }
}

// 创建单例实例
// const socketManager = new SocketManager();

// // 确保无法再创建新实例
// Object.freeze(socketManager);

// export default socketManager;
export default SocketManager;
