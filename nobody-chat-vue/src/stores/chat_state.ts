import { defineStore } from 'pinia'
import { User, type OnlineUser } from '@/models'
import { nextTick, ref } from 'vue'
import type {
  Msg,
  NetSocketDataType,
  RegisterSocketEventable,
  SetUser,
  UserOffline,
  UserOnline
} from '@/net/netsocket'

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

export const useChatState = defineStore('ChatState', () => {
  const onlineUsers = ref<OnlineUser[]>([])
  const user = ref<User>(new User())
  const historyRecords = ref<HistoryRecords>(new HistoryRecords())
  const talkTo = ref<TalkTo | null>(null)

  async function bindSocket(register: RegisterSocketEventable) {
    await register.registerEvent('setUser', bindSetUser)
    await register.registerEvent('userOnline', bindUserOnline)
    await register.registerEvent('msg', bindMsg)
    await register.registerEvent('userOffline', bindUserOffline)
  }

  function findUsername(id: string): string {
    return onlineUsers.value.find((u) => u.id === id)?.name ?? ''
  }

  function bindSetUser(data: NetSocketDataType) {
    data = data as SetUser

    user.value.id = data.setUser.id
    user.value.name = data.setUser.name

    onlineUsers.value.unshift({
      id: data.setUser.id,
      name: data.setUser.name,
      unread: 0
    })
  }

  function bindUserOnline(data: NetSocketDataType) {
    data = data as UserOnline

    onlineUsers.value.push({
      id: data.userOnline.id,
      name: data.userOnline.name,
      unread: 0
    })
  }

  function bindMsg(data: NetSocketDataType) {
    data = data as Msg

    const { from, msg } = data.msg
    const fromId = from

    const record = historyRecords.value.get(fromId)
    record.push([msg, ''])

    if (talkTo.value?.user.id !== fromId) {
      const user = onlineUsers.value.find((u) => u.id === fromId)
      if (user) {
        if (isNaN(user.unread)) {
          user.unread = 0
        }
        user.unread += 1
      }
    }

    nextTick(() => {
      const list = document.getElementById('bubbleList')
      if (list?.children?.length ?? 0 > 0) {
        list?.children[list.children.length! - 1].scrollIntoView({
          behavior: 'smooth'
        })
      }
    })
  }

  function bindUserOffline(data: NetSocketDataType) {
    data = data as UserOffline
    const id = data.userOffline.id

    if (user.value.id === id) {
      return
    }

    if (talkTo.value?.user.id ?? '' === id) {
      talkTo.value = null
    }
    onlineUsers.value = onlineUsers.value.filter((t) => t.id !== id)
  }

  function setTalkTo(user: User) {
    if (!user) {
      return
    }

    const newTalkTo = new TalkTo()
    newTalkTo.user = user
    newTalkTo.records = historyRecords.value.get(user.id)

    talkTo.value = newTalkTo

    const tmpUser = onlineUsers.value.find((u) => u.id === user.id)
    tmpUser && (tmpUser.unread = 0)
  }

  function newRecord(to: string, msg: string) {
    historyRecords.value.get(to).push(['', msg])
  }

  function bubbleListToEnd() {
    scrollToEnd()
  }

  let scrollToEnd = () => {
    const list = document.getElementById('bubbleList')
    if (list && list.children.length > 0) {
      scrollToEnd = () => {
        list.children[list.children.length - 1].scrollIntoView({
          behavior: 'smooth'
        })
      }
    }
  }

  function appendOnlineUsers(...newOnlineUsers: OnlineUser[]) {
    for (const u of newOnlineUsers) {
      if (onlineUsers.value.some((e) => e.id === u.id)) {
        continue
      }

      onlineUsers.value.push(u)
    }
  }

  return {
    onlineUsers,
    user,
    talkTo,
    setTalkTo,
    newRecord,
    bindSocket,
    bubbleListToEnd,
    appendOnlineUsers,
    findUsername
  }
})

export class TalkTo {
  user: User = new User()
  records: HistoryRecord[] = []
}
