import type { SignalType, SignalInfo } from '@/models'
import {
  type RegisterSocketEventable,
  type SocketSendable,
  type Signal,
  NetSocketSendData
} from '@/net/netsocket'
import { useNetSocket } from '@/stores/socket_state'

export interface SignalingServer {
  registerEvent(type: SignalType, handler: (si: SignalInfo) => void): void
  sendSignalDeny(from_id: string, to_id: string): void
  sendSignalOffer(from_id: string, to_id: string, sdp: string): void
  sendSignalAnswer(from_id: string, to_id: string, sdp: string): void
  sendSignalCandidate(from_id: string, to_id: string, candidate: string): void
  sendSignalRequest(from_id: string, to_id: string): void
}

/**
 * normal signaling server communication
 */
export class NormalSS implements SignalingServer {
  private events = new Map<SignalType, (si: SignalInfo) => void>()
  private socket: RegisterSocketEventable & SocketSendable

  constructor(socket: RegisterSocketEventable & SocketSendable = useNetSocket().netSocket) {
    this.socket = socket

    this.socket.registerEvent('signal', (entry) => {
      entry = entry as Signal
      this.handleEvent(entry.signal)
    })
  }

  private handleEvent(si: SignalInfo) {
    const ev = this.events.get(si.signal_type)
    if (!ev) {
      return
    }

    ev(si)
  }

  registerEvent(type: SignalType, handler: (si: SignalInfo) => void): void {
    this.events.set(type, handler)
  }
  sendSignalDeny(from_id: string, to_id: string) {
    const data = JSON.stringify(NetSocketSendData.newSignalDeny(from_id, to_id))
    this.socket.send(data)
  }
  sendSignalOffer(from_id: string, to_id: string, sdp: string) {
    const data = JSON.stringify(NetSocketSendData.newSignalOffer(from_id, to_id, sdp))
    this.socket.send(data)
  }
  sendSignalAnswer(from_id: string, to_id: string, sdp: string) {
    const data = JSON.stringify(NetSocketSendData.newSignalAnswer(from_id, to_id, sdp))
    this.socket.send(data)
  }
  sendSignalCandidate(from_id: string, to_id: string, candidate: string) {
    const data = JSON.stringify(NetSocketSendData.newSignalCandidate(from_id, to_id, candidate))
    this.socket.send(data)
  }
  sendSignalRequest(from_id: string, to_id: string) {
    const data = JSON.stringify(
      NetSocketSendData.newSignalRequest(from_id, to_id, new Date().getTime())
    )
    this.socket.send(data)
  }
}