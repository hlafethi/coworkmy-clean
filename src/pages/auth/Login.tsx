
import LoginForm from "@/components/auth/LoginForm";
import AuthLayout from "@/components/auth/AuthLayout";

const Login = () => {
  return (
    <AuthLayout 
      title="Connexion" 
      subtitle="Bienvenue à nouveau ! Connectez-vous à votre compte."
    >
      <LoginForm />
    </AuthLayout>
  );
};

export default Login;
