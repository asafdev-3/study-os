import { useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator, ImageBackground, KeyboardAvoidingView, Linking, Platform, Pressable, SafeAreaView,
  ScrollView, StatusBar, StyleSheet, Text, TextInput, View,
} from 'react-native'
import WebView from 'react-native-webview'
import * as WebBrowser from 'expo-web-browser'
import * as Haptics from 'expo-haptics'
import { GlassSurface } from '../components/GlassSurface'
import Animated, { Easing, FadeIn, FadeInDown, FadeInUp, FadeOutUp, useReducedMotion } from 'react-native-reanimated'
import { supabase } from '../supabase'

const WEB_ORIGIN = 'https://study-os-three-pearl.vercel.app'
const CALLBACK = 'studyos://auth'
type Mode = 'login' | 'signup' | 'recovery'

function message(error: unknown) {
  const text = error instanceof Error ? error.message.toLowerCase() : ''
  if (text.includes('invalid login')) return 'E-mail ou senha incorretos.'
  if (text.includes('already registered')) return 'Este e-mail já tem cadastro.'
  if (text.includes('email not confirmed')) return 'Confirme seu e-mail antes de entrar.'
  if (text.includes('rate limit') || text.includes('too many')) return 'Muitas tentativas. Aguarde um pouco.'
  return 'Não foi possível continuar. Tente novamente.'
}

export default function App() {
  const webRef = useRef<React.ElementRef<typeof WebView>>(null)
  const reduceMotion = useReducedMotion()
  const enter = (delay = 0) => reduceMotion ? undefined : FadeInDown.duration(300).easing(Easing.out(Easing.cubic)).delay(delay)
  const [session, setSession] = useState<Awaited<ReturnType<typeof supabase.auth.getSession>>['data']['session']>(null)
  const [checking, setChecking] = useState(true)
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setChecking(false) })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next)
      setChecking(false)
    })
    return () => subscription.unsubscribe()
  }, [])

  function switchMode(next: Mode) {
    if (next === mode) return
    void Haptics.selectionAsync()
    setMode(next); setError(''); setNotice(''); setConfirm('')
  }

  async function submit() {
    setError('')
    setNotice('')
    const address = email.trim().toLowerCase()
    if (!address) return setError('Preencha seu e-mail.')
    if (mode === 'recovery') {
      setBusy(true)
      try {
        const { error: authError } = await supabase.auth.resetPasswordForEmail(address, {
          redirectTo: WEB_ORIGIN + '/esqueci-senha',
        })
        if (authError) throw authError
        setNotice('Se houver uma conta, você receberá um link para redefinir a senha.')
      } catch (cause) { setError(message(cause)) }
      finally { setBusy(false) }
      return
    }
    if (!password) return setError('Preencha sua senha.')
    if (mode === 'signup' && password.length < 8) return setError('Crie uma senha com pelo menos 8 caracteres.')
    if (mode === 'signup' && password !== confirm) return setError('As senhas não coincidem.')
    setBusy(true)
    try {
      if (mode === 'signup') {
        const { data, error: authError } = await supabase.auth.signUp({
          email: address, password,
          options: { emailRedirectTo: WEB_ORIGIN + '/dashboard' },
        })
        if (authError) throw authError
        if (!data.session) setNotice('Conta criada. Confirme seu e-mail para continuar.')
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({ email: address, password })
        if (authError) throw authError
      }
    } catch (cause) { setError(message(cause)) }
    finally { setBusy(false) }
  }

  async function google() {
    setError('')
    setBusy(true)
    try {
      const { data, error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google', options: { redirectTo: CALLBACK, skipBrowserRedirect: true },
      })
      if (authError || !data.url) throw authError || new Error('OAuth sem endereço')
      const result = await WebBrowser.openAuthSessionAsync(data.url, CALLBACK)
      if (result.type === 'success') {
        const params = new URLSearchParams(result.url.split('#')[1] || result.url.split('?')[1] || '')
        const access_token = params.get('access_token')
        const refresh_token = params.get('refresh_token')
        if (!access_token || !refresh_token) throw new Error('Sessão Google inválida')
        const { error: sessionError } = await supabase.auth.setSession({ access_token, refresh_token })
        if (sessionError) throw sessionError
      }
    } catch { setError('O acesso com Google falhou. Tente novamente.') }
    finally { setBusy(false) }
  }

  if (checking) return <View style={styles.loading}><Animated.View entering={reduceMotion ? undefined : FadeIn.duration(260)} style={styles.loadingMark}><Text style={styles.logoLetter}>S</Text></Animated.View><ActivityIndicator color="#dce9fc" /></View>

  if (session) {
    return <SafeAreaView style={styles.shell}>
      <StatusBar barStyle="light-content" />
      <WebView
        ref={webRef}
        source={{ uri: WEB_ORIGIN + '/native-session' }}
        originWhitelist={[WEB_ORIGIN]}
        onShouldStartLoadWithRequest={({ url }) => {
          if (url.startsWith(WEB_ORIGIN + '/') || url === 'about:blank') return true
          if (url.startsWith('https://')) Linking.openURL(url)
          return false
        }}
        onMessage={({ nativeEvent }) => {
          if (nativeEvent.data !== 'STUDYOS_READY') return
          const payload = JSON.stringify({ access_token: session.access_token, refresh_token: session.refresh_token })
          webRef.current?.injectJavaScript(
            `window.dispatchEvent(new CustomEvent('studyos-native-session', { detail: ${payload} })); true;`
          )
        }}
        onNavigationStateChange={({ url }) => {
          if (url === WEB_ORIGIN + '/login') supabase.auth.signOut()
        }}
        style={styles.web}
      />
    </SafeAreaView>
  }

  return <ImageBackground source={require("../../assets/study-room.webp")} style={styles.page} resizeMode="cover">
    <SafeAreaView style={styles.flex}>
    <StatusBar barStyle="light-content" />
    <View style={styles.glow} />
    <View style={styles.mark}><Text style={styles.markText}>S</Text></View>
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.center} keyboardShouldPersistTaps="handled">
        <Animated.View entering={reduceMotion ? undefined : FadeInDown.springify().damping(26).stiffness(170).mass(0.8)} style={styles.card}>
          <GlassSurface />
          <Animated.View entering={enter(100)} style={styles.brand}><View style={styles.logo}><Text style={styles.logoLetter}>S</Text></View><Text style={styles.brandText}>STUDYOS</Text></Animated.View>
          <Animated.Text key={mode + 'title'} entering={reduceMotion ? undefined : FadeInUp.duration(240).easing(Easing.out(Easing.cubic))} style={styles.title}>{mode === 'recovery' ? 'Recupere seu acesso.' : mode === 'signup' ? 'Seu estudo começa aqui.' : 'Seu espaço de estudo.'}</Animated.Text>
          <Animated.Text key={mode + 'subtitle'} entering={reduceMotion ? undefined : FadeIn.duration(300).delay(60)} style={styles.subtitle}>{mode === 'recovery' ? 'Enviaremos um link para seu e-mail.' : mode === 'signup' ? 'Crie sua conta para começar.' : 'Entre e continue de onde parou.'}</Animated.Text>
          {mode !== 'recovery' && <Animated.View entering={enter(140)} style={styles.switch}>
            <Pressable onPress={() => switchMode('login')} style={[styles.switchItem, mode === 'login' && styles.selected]}><Text style={styles.switchText}>Entrar</Text></Pressable>
            <Pressable onPress={() => switchMode('signup')} style={[styles.switchItem, mode === 'signup' && styles.selected]}><Text style={styles.switchText}>Criar conta</Text></Pressable>
          </Animated.View>}
          <Animated.View key={mode + 'fields'} entering={reduceMotion ? undefined : FadeInDown.duration(260).easing(Easing.out(Easing.cubic)).delay(30)} exiting={reduceMotion ? undefined : FadeOutUp.duration(110)}>
          <Text style={styles.label}>E-mail</Text>
          <TextInput style={styles.input} placeholder="voce@email.com" placeholderTextColor="#acb9ca" autoCapitalize="none" keyboardType="email-address" autoComplete="email" value={email} onChangeText={setEmail} />
          {mode !== 'recovery' && <>
            <View style={styles.row}><Text style={styles.label}>Senha</Text>{mode === 'login' && <Pressable onPress={() => switchMode('recovery')}><Text style={styles.link}>Esqueceu a senha?</Text></Pressable>}</View>
            <View style={styles.inputRow}>
              <TextInput style={styles.passwordInput} placeholder={mode === 'signup' ? 'Mínimo de 8 caracteres' : 'Sua senha'} placeholderTextColor="#acb9ca" secureTextEntry={!showPassword} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} value={password} onChangeText={setPassword} />
              <Pressable accessibilityLabel={showPassword ? 'Ocultar senha' : 'Mostrar senha'} onPress={() => setShowPassword(!showPassword)}><Text style={styles.link}>{showPassword ? 'Ocultar' : 'Mostrar'}</Text></Pressable>
            </View>
          </>}
          {mode === 'signup' && <><Text style={styles.label}>Confirmar senha</Text><TextInput style={styles.input} placeholder="Digite a senha novamente" placeholderTextColor="#acb9ca" secureTextEntry={!showPassword} value={confirm} onChangeText={setConfirm} /></>}
          {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
          {!!notice && <Text style={styles.notice}>{notice}</Text>}
          <Pressable disabled={busy} onPress={submit} style={({ pressed }) => [styles.primary, pressed && styles.pressed]}><Text style={styles.primaryText}>{busy ? 'Aguarde…' : mode === 'recovery' ? 'Enviar link' : mode === 'signup' ? 'Criar conta' : 'Entrar'}</Text></Pressable>
          {mode === 'recovery' ? <Pressable onPress={() => switchMode('login')}><Text style={styles.back}>Voltar ao acesso</Text></Pressable> : <><Text style={styles.or}>ou</Text><Pressable disabled={busy} onPress={google} style={styles.secondary}><Text style={styles.secondaryText}>Continuar com Google</Text></Pressable></>}
          </Animated.View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
    </SafeAreaView>
  </ImageBackground>
}

const styles = StyleSheet.create({
  flex: { flex: 1 }, page: { flex: 1, backgroundColor: '#101a28' }, shell: { flex: 1, backgroundColor: '#101a28' }, web: { flex: 1, backgroundColor: '#101a28' },
  loading: { flex: 1, gap: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#101a28' }, loadingMark: { width: 48, height: 48, borderRadius: 15, backgroundColor: '#071325', alignItems: 'center', justifyContent: 'center' },
  glow: { position: 'absolute', width: 340, height: 340, borderRadius: 170, top: -100, right: -130, backgroundColor: '#1c3454', opacity: .5 },
  mark: { position: 'absolute', alignSelf: 'center', top: '20%' }, markText: { color: 'rgba(225,236,255,.06)', fontSize: 340, fontWeight: '700' },
  center: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 20, paddingVertical: 30 },
  card: { maxWidth: 420, width: '100%', alignSelf: 'center', padding: 26, borderRadius: 28, borderWidth: 1, borderColor: 'rgba(235,245,255,.24)', backgroundColor: 'rgba(27,44,65,.56)', overflow: 'hidden' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 28 }, logo: { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: '#071325' }, logoLetter: { color: '#7199ff', fontSize: 21, fontWeight: '700' }, brandText: { color: '#e6eef9', fontSize: 13, fontWeight: '700', letterSpacing: 2 },
  title: { color: '#f4f6fa', fontSize: 28, fontWeight: '600', letterSpacing: -.8 }, subtitle: { color: '#b8c3d2', fontSize: 14, marginTop: 8, marginBottom: 24, lineHeight: 21 },
  switch: { flexDirection: 'row', borderRadius: 28, borderWidth: 1, borderColor: 'rgba(228,239,255,.17)', padding: 4, marginBottom: 23 },
  switchItem: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 40, borderRadius: 24 }, selected: { backgroundColor: 'rgba(207,226,255,.19)' }, switchText: { color: '#fff', fontSize: 13 },
  label: { color: '#e5edf8', fontSize: 12, marginBottom: 8 }, row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 17 },
  link: { color: '#d7e6fc', fontSize: 12 }, input: { height: 50, borderRadius: 15, borderWidth: 1, borderColor: 'rgba(228,239,255,.22)', backgroundColor: 'rgba(7,16,29,.38)', paddingHorizontal: 14, color: '#fff', fontSize: 16 },
  inputRow: { height: 50, flexDirection: 'row', alignItems: 'center', borderRadius: 15, borderWidth: 1, borderColor: 'rgba(228,239,255,.22)', backgroundColor: 'rgba(7,16,29,.38)', paddingHorizontal: 14 },
  passwordInput: { flex: 1, color: '#fff', fontSize: 16 }, primary: { height: 50, borderRadius: 25, backgroundColor: '#dce9fc', alignItems: 'center', justifyContent: 'center', marginTop: 24 },
  primaryText: { color: '#14243a', fontSize: 14, fontWeight: '700' }, pressed: { opacity: .8 }, or: { color: '#bdc9d8', textAlign: 'center', marginVertical: 18, fontSize: 12 },
  secondary: { height: 50, borderRadius: 25, borderWidth: 1, borderColor: 'rgba(235,245,255,.26)', backgroundColor: 'rgba(235,245,255,.10)', alignItems: 'center', justifyContent: 'center' },
  secondaryText: { color: '#f4f6fb', fontSize: 14, fontWeight: '600' }, back: { color: '#d7e6fc', textAlign: 'center', marginTop: 20, padding: 12 },
  error: { color: '#ffd4d7', marginTop: 14, fontSize: 12 }, notice: { color: '#d6e8ff', marginTop: 14, fontSize: 12 },
})
