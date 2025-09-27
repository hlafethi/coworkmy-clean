import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Alert, AlertDescription } from '../../components/ui/alert'
import { Loader2 } from 'lucide-react'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    // Récupère le token depuis les query params OU le hash
    let token_hash = searchParams.get('token_hash')
    let type = searchParams.get('type')

    if (!token_hash) {
      // Si pas dans les query params, essaye dans le hash
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      token_hash = hashParams.get('token_hash')
      type = hashParams.get('type')
    }

    if (!token_hash || type !== 'recovery') {
      setError('Lien de réinitialisation invalide ou expiré')
      return
    }

    const exchangeToken = async () => {
      try {
        if (!token_hash) {
          setError('Token de réinitialisation manquant');
          return;
        }
        const { error } = await supabase.auth.verifyOtp({
          token_hash,
          type: 'recovery'
        })
        if (error) throw error
        console.log('Token vérifié avec succès')
      } catch (error) {
        console.error('Erreur de vérification du token:', error)
        setError('Lien de réinitialisation invalide ou expiré')
      }
    }

    exchangeToken()
  }, [searchParams, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      return
    }

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères')
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) throw error

      alert('Mot de passe mis à jour avec succès !')
      navigate('/dashboard')
    } catch (error: any) {
      console.error('Erreur:', error)
      setError('Erreur lors de la mise à jour : ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  if (error && !password) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-red-600">Erreur</CardTitle>
            <CardDescription className="text-gray-600">{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => navigate('/auth/forgot-password')}
              className="w-full"
            >
              Demander un nouveau lien
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-gray-800">
            Nouveau mot de passe
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Nouveau mot de passe
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Confirmer le mot de passe
              </label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Mise à jour...
                </>
              ) : (
                'Mettre à jour le mot de passe'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
