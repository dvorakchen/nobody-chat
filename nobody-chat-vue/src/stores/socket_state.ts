import { NetSocket, NetSocketSendData } from '@/net/netsocket'
import { defineStore } from 'pinia'
import { useChatState } from '@/stores/chat_state'

export const useNetSocket = defineStore('netSocket', {
  state: () => ({
    netSocket: new NetSocket()
  }),
  actions: {
    async bindSocket() {
      const chatState = useChatState()

      await chatState.bindSocket(this.netSocket)
    },

    sendTalkTo(to: string, msg: string) {
      const data = JSON.stringify(NetSocketSendData.newTalkTo(to, msg))
      this.netSocket.send(data)
    },
    sendSignalDeny(from_id: string, to_id: string) {
      const data = JSON.stringify(NetSocketSendData.newSignalDeny(from_id, to_id))
      this.netSocket.send(data)
    },
    sendSignalOffer(from_id: string, to_id: string, sdp: string) {
      const data = JSON.stringify(NetSocketSendData.newSignalOffer(from_id, to_id, sdp))
      this.netSocket.send(data)
    },
    sendSignalAnswer(from_id: string, to_id: string, sdp: string) {
      const data = JSON.stringify(NetSocketSendData.newSignalAnswer(from_id, to_id, sdp))
      this.netSocket.send(data)
    },
    sendSignalCandidate(from_id: string, to_id: string, candidate: string) {
      const data = JSON.stringify(NetSocketSendData.newSignalCandidate(from_id, to_id, candidate))
      this.netSocket.send(data)
    },
    sendSignalRequest(from_id: string, to_id: string) {
      const data = JSON.stringify(
        NetSocketSendData.newSignalRequest(from_id, to_id, new Date().getTime())
      )
      this.netSocket.send(data)
    }
  }
})
