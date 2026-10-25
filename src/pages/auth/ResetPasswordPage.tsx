import { useState } from 'react';

import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import { CheckCircle, Eye, EyeOff, KeyRound } from 'lucide-react';

import { authService } from '../../services/authService';

import { extractApiError } from '../../utils/apiError';



const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;



export function ResetPasswordPage() {

  const navigate = useNavigate();

  const [searchParams] = useSearchParams();

  const token = searchParams.get('token')?.trim() ?? '';



  const [password, setPassword] = useState('');

  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [isSuccess, setIsSuccess] = useState(false);



  const handleSubmit = async (e: React.FormEvent) => {

    e.preventDefault();

    setError(null);



    if (!token) {

      setError('Link đặt lại không hợp lệ hoặc thiếu token');

      return;

    }



    if (password !== confirmPassword) {

      setError('Mật khẩu không khớp');

      return;

    }



    if (!PASSWORD_PATTERN.test(password)) {

      setError('Mật khẩu phải có ít nhất 8 ký tự và chứa chữ cái cùng số');

      return;

    }



    setIsLoading(true);

    try {

      await authService.resetPassword({ token, password, confirmPassword });

      setIsSuccess(true);

    } catch (err) {

      setError(extractApiError(err, 'Không thể đặt lại mật khẩu. Link có thể đã hết hạn.'));

    } finally {

      setIsLoading(false);

    }

  };



  if (!token) {

    return (

      <div className="w-full text-center">

        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Link không hợp lệ</h2>

        <p className="mt-2 text-gray-500 dark:text-gray-400">

          Thiếu token đặt lại mật khẩu. Vui lòng dùng lại link trong email hoặc yêu cầu link mới.

        </p>

        <Link to="/forgot-password" className="btn btn-primary btn-lg mt-6 w-full">

          Quên mật khẩu

        </Link>

      </div>

    );

  }



  if (isSuccess) {

    return (

      <div className="w-full text-center">

        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success-100 dark:bg-success-900">

          <CheckCircle className="h-8 w-8 text-success-600" />

        </div>

        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Đặt lại thành công</h2>

        <p className="mt-2 text-gray-500 dark:text-gray-400">

          Bạn có thể đăng nhập bằng mật khẩu mới.

        </p>

        <button

          type="button"

          onClick={() => navigate('/login', { replace: true })}

          className="btn btn-primary btn-lg mt-6 w-full"

        >

          Đến trang đăng nhập

        </button>

      </div>

    );

  }



  return (

    <div className="w-full">

      <div className="mb-8 text-center">

        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Đặt lại mật khẩu</h2>

        <p className="mt-1 text-gray-500 dark:text-gray-400">

          Nhập mật khẩu mới cho tài khoản của bạn.

        </p>

      </div>



      <form onSubmit={handleSubmit} className="space-y-4">

        {error && (

          <div className="rounded-lg border border-error-200 bg-error-50 p-3 text-sm text-error-700 dark:border-error-800 dark:bg-error-950 dark:text-error-400">

            {error}

          </div>

        )}



        <div>

          <label htmlFor="password" className="label">

            Mật khẩu mới

          </label>

          <div className="relative">

            <input

              id="password"

              type={showPassword ? 'text' : 'password'}

              value={password}

              onChange={(e) => setPassword(e.target.value)}

              className="input pr-10"

              placeholder="Tối thiểu 8 ký tự, chữ và số"

              required

            />

            <button

              type="button"

              onClick={() => setShowPassword(!showPassword)}

              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"

            >

              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}

            </button>

          </div>

        </div>



        <div>

          <label htmlFor="confirmPassword" className="label">

            Xác nhận mật khẩu

          </label>

          <input

            id="confirmPassword"

            type="password"

            value={confirmPassword}

            onChange={(e) => setConfirmPassword(e.target.value)}

            className="input"

            placeholder="Xác nhận mật khẩu mới"

            required

          />

        </div>



        <button type="submit" disabled={isLoading} className="btn btn-primary btn-lg w-full">

          {isLoading ? (

            'Đang đặt lại...'

          ) : (

            <>

              <KeyRound className="h-5 w-5" />

              Đặt lại mật khẩu

            </>

          )}

        </button>

      </form>



      <Link

        to="/login"

        className="mt-6 block text-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400"

      >

        Quay lại đăng nhập

      </Link>

    </div>

  );

}


