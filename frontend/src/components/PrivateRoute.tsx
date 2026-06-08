import { Navigate } from 'react-router-dom';
import { getUser } from '../utils/auth';

interface Props {
  element: React.ReactElement;
  niveis?: number[];
}

export default function PrivateRoute({ element, niveis }: Props) {
  const user = getUser();
  const userNivel = Number((user as any)?.nivel ?? (user as any)?.nivel_acesso ?? 0);

  if (!user) return <Navigate to="/" replace />;

  if (niveis && !niveis.includes(userNivel)) {
    return <Navigate to="/home" replace />;
  }

  return element;
}