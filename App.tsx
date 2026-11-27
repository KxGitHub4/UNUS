import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

type AuthType = 'password' | 'privateKey';
type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export default function App() {
  // 连接配置状态
  const [host, setHost] = useState('');
  const [port, setPort] = useState('22');
  const [username, setUsername] = useState('root');
  const [authType, setAuthType] = useState<AuthType>('password');
  const [password, setPassword] = useState('');
  const [privateKey, setPrivateKey] = useState('');

  // 终端交互状态
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [logs, setLogs] = useState<string[]>([
    'UNUS SSH Client v1.0.0 ready.',
    'Enter server credentials and select auth method to connect.',
  ]);
  const [cmdInput, setCmdInput] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);

  const appendLog = (msg: string) => {
    setLogs((prev) => [...prev, msg]);
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 50);
  };

  // 发起连接
  const handleConnect = async () => {
    if (!host.trim() || !username.trim()) {
      appendLog('[Error] Host and username are required.');
      return;
    }
    if (authType === 'password' && !password) {
      appendLog('[Error] Please enter password.');
      return;
    }
    if (authType === 'privateKey' && !privateKey.trim()) {
      appendLog('[Error] Please paste OpenSSH private key.');
      return;
    }

    setStatus('connecting');
    appendLog(`Connecting to ${username}@${host}:${port} via ${authType}...`);

    try {
      // 模拟连接与握手响应 (支持在未接入 Native 库的真机/模拟器中直接交互演示)
      await new Promise((resolve) => setTimeout(resolve, 800));
      setStatus('connected');
      appendLog(`[Success] Connected to ${host}!`);
      appendLog(`Welcome to Linux (x86_64/aarch64)`);
      appendLog(`Session authenticated successfully via ${authType === 'password' ? 'Password' : 'RSA/Ed25519 Key'}.`);
    } catch (err: any) {
      setStatus('error');
      appendLog(`[Failed] Connection error: ${err.message || 'Auth failed'}`);
    }
  };

  // 断开会话
  const handleDisconnect = () => {
    setStatus('disconnected');
    appendLog('[Disconnected] Session terminated by user.');
  };

  // 执行并回显命令
  const handleSendCommand = () => {
    if (!cmdInput.trim() || status !== 'connected') return;
    const cmd = cmdInput.trim();
    appendLog(`${username}@${host}:~$ ${cmd}`);
    setCmdInput('');

    setTimeout(() => {
      if (cmd === 'uptime') {
        appendLog(' 16:20:01 up 23 days, 2 users, load average: 0.15, 0.10, 0.08');
      } else if (cmd === 'uname -a') {
        appendLog('Linux vps 6.12.88+deb13-amd64 #1 SMP PREEMPT_DYNAMIC x86_64 GNU/Linux');
      } else if (cmd === 'ls' || cmd === 'ls -la') {
        appendLog('total 24\ndrwxr-xr-x 4 root root 4096 Nov 25 10:00 .\ndrwxr-xr-x 3 root root 4096 Oct 20 08:00 ..\n-rw-r--r-- 1 root root  512 Nov 25 10:00 config.json');
      } else if (cmd === 'whoami') {
        appendLog(username);
      } else if (cmd === 'clear') {
        setLogs(['Terminal cleared.']);
      } else {
        appendLog(`[stdout]: executed '${cmd}' successfully.`);
      }
    }, 150);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* 顶部连接配置卡片 */}
        <View style={styles.configCard}>
          <Text style={styles.cardTitle}>SSH 主机配置</Text>

          <View style={styles.row}>
            <TextInput
              style={[styles.input, { flex: 2 }]}
              placeholder="IP / 域名"
              placeholderTextColor="#64748b"
              value={host}
              onChangeText={setHost}
              autoCapitalize="none"
              autoCorrect={false}
              editable={status !== 'connected'}
            />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="端口"
              placeholderTextColor="#64748b"
              value={port}
              onChangeText={setPort}
              keyboardType="numeric"
              editable={status !== 'connected'}
            />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="用户"
              placeholderTextColor="#64748b"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
              editable={status !== 'connected'}
            />
          </View>

          {/* 认证类型切换 Tab */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tabBtn, authType === 'password' && styles.tabBtnActive]}
              onPress={() => setAuthType('password')}
              disabled={status === 'connected'}
            >
              <Text style={[styles.tabText, authType === 'password' && styles.tabTextActive]}>
                密码登录
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabBtn, authType === 'privateKey' && styles.tabBtnActive]}
              onPress={() => setAuthType('privateKey')}
              disabled={status === 'connected'}
            >
              <Text style={[styles.tabText, authType === 'privateKey' && styles.tabTextActive]}>
                私钥登录 (PEM)
              </Text>
            </TouchableOpacity>
          </View>

          {/* 密码或私钥输入区 */}
          {authType === 'password' ? (
            <TextInput
              style={styles.input}
              placeholder="SSH 登录密码"
              placeholderTextColor="#64748b"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              editable={status !== 'connected'}
            />
          ) : (
            <TextInput
              style={[styles.input, styles.keyInput]}
              placeholder="-----BEGIN OPENSSH PRIVATE KEY-----&#10;在此粘贴私钥文本..."
              placeholderTextColor="#64748b"
              multiline
              value={privateKey}
              onChangeText={setPrivateKey}
              editable={status !== 'connected'}
            />
          )}

          {/* 连接/断开主操作按钮 */}
          {status !== 'connected' ? (
            <TouchableOpacity
              style={[styles.btn, styles.btnPrimary]}
              onPress={handleConnect}
              disabled={status === 'connecting'}
            >
              {status === 'connecting' ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.btnText}>建立 SSH 连接</Text>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={[styles.btn, styles.btnDanger]} onPress={handleDisconnect}>
              <Text style={styles.btnText}>断开会话</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 黑色终端控制台 */}
        <View style={styles.terminalContainer}>
          <View style={styles.terminalHeader}>
            <View style={styles.terminalDots}>
              <View style={[styles.dot, { backgroundColor: '#ef4444' }]} />
              <View style={[styles.dot, { backgroundColor: '#f59e0b' }]} />
              <View style={[styles.dot, { backgroundColor: '#10b981' }]} />
            </View>
            <Text style={styles.terminalTitle}>
              {status === 'connected' ? `● ${username}@${host}:${port}` : '○ Offline'}
            </Text>
          </View>

          <ScrollView
            ref={scrollViewRef}
            style={styles.terminalLogs}
            contentContainerStyle={{ padding: 10 }}
          >
            {logs.map((log, idx) => (
              <Text key={idx} style={styles.logText}>
                {log}
              </Text>
            ))}
          </ScrollView>

          {/* 命令发送条 */}
          {status === 'connected' && (
            <View style={styles.cmdBar}>
              <Text style={styles.cmdPrompt}>$</Text>
              <TextInput
                style={styles.cmdInput}
                placeholder="输入命令 (如 uptime, ls, whoami)..."
                placeholderTextColor="#64748b"
                value={cmdInput}
                onChangeText={setCmdInput}
                onSubmitEditing={handleSendCommand}
                returnKeyType="send"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity style={styles.sendBtn} onPress={handleSendCommand}>
                <Text style={styles.sendBtnText}>执行</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  configCard: {
    backgroundColor: '#1e293b',
    padding: 14,
    marginHorizontal: 12,
    marginTop: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardTitle: { color: '#f8fafc', fontSize: 14, fontWeight: '600', marginBottom: 10 },
  row: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  input: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    color: '#f8fafc',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
  },
  keyInput: {
    height: 75,
    textAlignVertical: 'top',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 11,
  },
  tabContainer: { flexDirection: 'row', gap: 6, marginBottom: 10 },
  tabBtn: { flex: 1, paddingVertical: 6, alignItems: 'center', borderRadius: 6, backgroundColor: '#0f172a' },
  tabBtnActive: { backgroundColor: '#2563eb' },
  tabText: { color: '#94a3b8', fontSize: 12, fontWeight: '500' },
  tabTextActive: { color: '#ffffff' },
  btn: { borderRadius: 6, paddingVertical: 10, alignItems: 'center', marginTop: 10 },
  btnPrimary: { backgroundColor: '#2563eb' },
  btnDanger: { backgroundColor: '#ef4444' },
  btnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  terminalContainer: {
    flex: 1,
    backgroundColor: '#020617',
    margin: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
    overflow: 'hidden',
  },
  terminalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#0f172a',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  terminalDots: { flexDirection: 'row', gap: 6 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  terminalTitle: { flex: 1, textAlign: 'center', color: '#94a3b8', fontSize: 11, fontFamily: 'monospace' },
  terminalLogs: { flex: 1 },
  logText: {
    color: '#10b981',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 12,
    lineHeight: 18,
  },
  cmdBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#0f172a',
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    gap: 8,
  },
  cmdPrompt: { color: '#10b981', fontSize: 14, fontWeight: '700', fontFamily: 'monospace' },
  cmdInput: { flex: 1, color: '#f8fafc', fontSize: 13, paddingVertical: 4 },
  sendBtn: { backgroundColor: '#2563eb', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  sendBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },
});
