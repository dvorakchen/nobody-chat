import { newConnection, type OnlineUserModel, type WebSocketData } from '@/http'
import { handleRecvSignal } from '@/rtc'
import { defineStore } from 'pinia'
import { ref, nextTick } from 'vue'

export type HistoryRecord = [string, string]
export class HistoryRecords {
  private records: Map<string, HistoryRecord[]> = new Map()

  public get(id: string): HistoryRecord[] {
    let rs = this.records.get(id)
    if (rs === undefined) {
      rs = []
      this.records.set(id, rs)
    }

    return rs
  }
}

export const useChatState = defineStore('chatState', {
  state: () => ({
    socket: newConnection(),
    historyRecords: ref<HistoryRecords>(new HistoryRecords()),
    onlineUsers: ref<OnlineUserModel[]>([]),
    currentChat: ref<OnlineUserModel | null>(null),
    user: ref<User>(new User()),
    currentRecords: ref<HistoryRecord[]>([]),
    talkTo: ref<User | null>(null),
    notices: ref<string[]>([])
  }),
  actions: {
    initSocket() {
      let socket = this.socket
      socket.onmessage = (event) => {
        let data: WebSocketData = JSON.parse(event.data)
        if (data.msg_type.setUser) {
          this.setUserInfo(data.msg_type.setUser)
        } else if (data.msg_type.userOnline) {
          this.newUserOnline(data.msg_type.userOnline)
        } else if (data.msg_type.msg) {
          this.receiveMsg(data.msg_type.msg.from, data.msg_type.msg.msg)
        } else if (data.msg_type.userOffline) {
          this.removeUser(data.msg_type.userOffline.id)
        } else if (data.msg_type.signal) {
          handleRecvSignal(data.msg_type.signal)
        }
      }
    },
    setCurrentChat(value: OnlineUserModel) {
      this.currentChat = value
    },
    initOnlineUsers(onlineUsers: OnlineUserModel[]) {
      this.onlineUsers = onlineUsers
    },
    setUserInfo(user: OnlineUserModel) {
      this.user.id = user.id
      this.user.name = user.name

      this.onlineUsers.unshift({
        id: user.id,
        name: user.name,
        unread: 0
      })
    },
    newUserOnline(user: OnlineUserModel) {
      this.onlineUsers.push({
        id: user.id,
        name: user.name,
        unread: 0
      })
    },
    receiveMsg(fromId: string, msg: string) {
      let record = this.historyRecords.get(fromId)
      record.push([msg, ''])

      if (this.talkTo?.id !== fromId) {
        let user = this.onlineUsers.find((e) => e.id === fromId)
        if (user) {
          if (isNaN(user.unread)) {
            user.unread = 0
          }
          user.unread += 1
        }
      }

      nextTick(() => {
        let list = document.getElementById('bubbleList')
        if (list?.children?.length ?? 0 > 0) {
          list?.children[list.children.length! - 1].scrollIntoView({
            behavior: 'smooth'
          })
        }
      })
    },
    removeUser(id: string) {
      if (this.talkTo?.id ?? '' === id) {
        this.talkTo = null
      }
      this.onlineUsers = this.onlineUsers.filter((e) => e.id !== id)
    },
    setTalkTo(user: User) {
      this.talkTo = user
      this.currentRecords = this.historyRecords.get(user.id)
      let tmpUser = this.onlineUsers.find((e) => e.id === user.id)
      tmpUser && (tmpUser.unread = 0)
    },
    sendNewMsg(to: string, msg: string) {
      this.historyRecords.get(to).push(['', msg])
    }
  }
})

export class User {
  id = ''
  name = ''
}
