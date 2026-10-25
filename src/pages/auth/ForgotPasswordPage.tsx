import { useState } from 'react';

import { Link } from 'react-router-dom';

import { ArrowLeft, Mail, CheckCircle } from 'lucide-react';

import { authService } from '../../services/authService';

import { extractApiError } from '../../utils/apiError';



export function ForgotPasswordPage() {

  const [email, setEmail] = useState('');

  const [isLoading, setIsLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [success, setSuccess] = useState(false);



  const handleSubmit = async (e: React.FormEvent) => {

    e.preventDefault();

    setIsLoading(true);

    setError(null);

    try {

      await authService.forgetPassword({ email: email.trim() });

      setSuccess(true);

    } catch (err) {

      setError(extractApiError(err, 'Không thể gửi email đặt lại mật khẩu'));

    } finally {

      setIsLoading(false);

    }

  };



  if (success) {

    return (

      <div className="w-full text-center">

        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success-100 dark:bg-success-900">

          <CheckCircle className="h-8 w-8 text-success-600" />

        </div>

        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Kiểm tra email</h2>

        <p className="mt-2 text-gray-500 dark:text-gray-400">

          Nếu <span className="font-medium text-gray-700 dark:text-gray-300">{email}</span> có trong hệ thống,

          bạn sẽ nhận được link đặt lại mật khẩu.

        </p>

        <Link to="/login" className="btn btn-primary btn-lg mt-6 w-full">

          <ArrowLeft className="h-5 w-5" />

          Quay lại đăng nhập

        </Link>

      </div>

    );

  }



  return (

    <div className="w-full">

      <div className="mb-8 text-center">

        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Quên mật khẩu</h2>

        <p className="mt-1 text-gray-500 dark:text-gray-400">

          Nhập email để nhận link đặt lại mật khẩu.

        </p>

      </div>



      <form onSubmit={handleSubmit} className="space-y-4">

        <div>

          <label htmlFor="email" className="label">

            Email

          </label>

          <div className="relative">

            <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />

            <input

              id="email"

              type="email"

              value={email}

              onChange={(e) => setEmail(e.target.value)}

              className="input pl-10"

              required

            />

          </div>

        </div>

        {error && (

          <div className="rounded-lg border border-error-200 bg-error-50 p-3 text-sm text-error-700 dark:border-error-800 dark:bg-error-950 dark:text-error-400">

            {error}

          </div>

        )}

        <button type="submit" disabled={isLoading} className="btn btn-primary btn-lg w-full">

          {isLoading ? 'Đang gửi...' : 'Gửi link đặt lại'}

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


