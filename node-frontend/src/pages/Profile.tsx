import axios from 'axios';

import React, { useState, useEffect } from 'react';
import { Check, Edit2, UserCircle, Info } from 'lucide-react';
import Card, { CardContent, CardHeader } from '../components/Card';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  profilePicture?: string;
  age?: number;
  height?: number;
  weight?: number;
  gender?: "male" | "female" | string;
}


const Profile: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<UserProfile>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (user) {
      setProfile({
        id: user.id,
        name: user.name || 'John Doe',
        email: user.email,
        age: user.age,
        height: user.height || 0, // Store raw number (or string) without "cm"
        weight: user.weight || 0, // Store raw number (or string) without "kg"
        gender: user.gender || 'Not specified',
      });
    }
  }, [user]);



  const handleEditToggle = () => {
    if (isEditing) {
      // Cancel editing, reset form data
      setFormData({});
      setError('');
      setSuccess('');
    } else {
      // Start editing, initialize form data with current profile
      setFormData({ ...profile });
    }
    setIsEditing(!isEditing);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.put('http://localhost:5000/api/auth/edit', formData, {
        headers: {
          'Content-Type': 'application/json',
        },
        withCredentials: true, // this ensures cookies or session tokens are sent
      });

      console.log(response)
      if (response.status === 200 && response.data.success) {
        setProfile({
          ...profile!,
          ...formData,
        });

        setSuccess('Profile updated successfully!');
        setIsEditing(false);
      } else {
        throw new Error(response.data.message || 'Something went wrong!');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };



  if (!profile) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Your Profile</h1>
          <p className="text-dark-300">
            Manage your personal information
          </p>
        </div>
        <Button
          variant={isEditing ? 'ghost' : 'primary'}
          icon={isEditing ? <Check /> : <Edit2 />}
          iconPosition="left"
          onClick={handleEditToggle}
        >
          {isEditing ? 'Cancel' : 'Edit Profile'}
        </Button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-error-900/30 border border-error-700 rounded-md text-error-400">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-success-900/30 border border-success-700 rounded-md text-success-400">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">Profile</h2>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center mb-6">
                <div className="w-32 h-32 rounded-full bg-dark-700 flex items-center justify-center mb-4">
                  {(() => {
                    const seeds = [
                      'Blaze', 'Shadow', 'Nova', 'Jett', 'Zane', 'Maverick', 'Ace', 'Ryder',
                      'Knox', 'Axel', 'Dash', 'Hunter', 'Xeno'
                    ];

                    const getSwagAvatar = (name: string, gender: string = 'male') => {
                      const index = name ? (name[0].toUpperCase().charCodeAt(0) - 65) % 13 : 0;
                      const seed = seeds[index];
                      const style = gender.toLowerCase() === 'female' ? 'lorelei' : 'micah';
                      return `https://api.dicebear.com/8.x/${style}/svg?seed=${seed}`;
                    };

                    const avatarUrl = profile.profilePicture || getSwagAvatar(profile.name, profile.gender || 'male');

                    return (
                      <img
                        src={avatarUrl}
                        alt={profile.name}
                        className="w-full h-full rounded-full object-cover border-4 border-dark-500 shadow-lg"
                      />
                    );
                  })()}


                </div>
                <h3 className="text-xl font-medium">{profile.name}</h3>
                <p className="text-dark-300">{profile.email}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">Personal Information</h2>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-dark-300 mb-1">
                        Full Name
                      </label>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        value={formData.name || ''}
                        onChange={handleInputChange}
                        className="input"
                        placeholder="Name"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-dark-300 mb-1">
                        Email Address
                      </label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email || ''}
                        onChange={handleInputChange}
                        className="input"
                        required
                        disabled  // Email shouldn't be editable in this UI
                      />
                    </div>

                    <div>
                      <label htmlFor="age" className="block text-sm font-medium text-dark-300 mb-1">
                        Age
                      </label>
                      <input
                        id="age"
                        name="age"
                        type="number"
                        value={formData.age || ''}
                        onChange={handleInputChange}
                        className="input"
                        placeholder="Age"
                        onWheel={(e) => e.currentTarget.blur()}
                      />
                    </div>

                    <div>
                      <label htmlFor="height" className="block text-sm font-medium text-dark-300 mb-1">
                        Height
                      </label>
                      <div className="flex items-center">
                        <input
                          id="height"
                          name="height"
                          type="number"
                          value={formData.height || ''}
                          onChange={handleInputChange}
                          className="input rounded-r-none"
                          placeholder="Height"
                          min="0"
                          onWheel={(e) => e.currentTarget.blur()}
                        />
                        <span className="px-3 py-2 border border-l-0 border-dark-500 bg-dark-600 text-dark-300 rounded-r-md">
                          cm
                        </span>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="weight" className="block text-sm font-medium text-dark-300 mb-1">
                        Weight
                      </label>
                      <div className="flex items-center">
                        <input
                          id="weight"
                          name="weight"
                          type="number"
                          value={formData.weight || ''}
                          onChange={handleInputChange}
                          className="input rounded-r-none"
                          placeholder="Weight"
                          min="0"
                          onWheel={(e) => e.currentTarget.blur()}
                        />
                        <span className="px-3 py-2 border border-l-0 border-dark-500 bg-dark-600 text-dark-300 rounded-r-md">
                          kg
                        </span>
                      </div>
                    </div>

                  </div>

                  <div className="flex justify-end space-x-4 pt-4">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={handleEditToggle}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      isLoading={isLoading}
                    >
                      Save Changes
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-y-6 gap-x-4">
                    <div>
                      <h3 className="text-sm font-medium text-dark-300 mb-1">Age</h3>
                      <p className="text-lg">{profile.age || 'Not specified'}</p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-dark-300 mb-1">Height</h3>
                      <p className="text-lg">{profile.height ? `${profile.height} cm` : 'Not specified'}</p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-dark-300 mb-1">Weight</h3>
                      <p className="text-lg">{profile.weight ? `${profile.weight} kg` : 'Not specified'}</p>
                    </div>
                  </div>

                  <div className="bg-dark-700 p-4 rounded-lg mt-8 flex items-start">
                    <Info size={20} className="text-primary-400 mt-0.5 mr-3 flex-shrink-0" />
                    <p className="text-dark-200">
                      Keep your personal information updated for the best experience.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;