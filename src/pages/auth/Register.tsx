import RegisterForm from "@/components/auth/RegisterForm";
import AuthLayout from "@/components/auth/AuthLayout";

const Register = () => {
  return (
    <AuthLayout 
      title="Créer un compte" 
      subtitle="Rejoignez CoWorkMy et commencez à réserver vos espaces de travail."
    >
      <RegisterForm />
    </AuthLayout>
  );
};

export default Register;
