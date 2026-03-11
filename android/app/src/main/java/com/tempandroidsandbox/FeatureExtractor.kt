package com.tempandroidsandbox

import android.content.Context
import android.content.pm.ApplicationInfo
import android.content.pm.PackageManager
import android.util.Log
import java.io.File

/**
 * FeatureExtractor - Maps static app analysis signals to the 139-dimensional
 * CICMalDroid feature vector (system call frequencies).
 *
 * Since we cannot run apps in a dynamic sandbox on the device, this class uses
 * a static-to-dynamic mapping approach: permissions, components, intent filters,
 * and app metadata are mapped to estimated system call frequency patterns.
 *
 * The 139 features correspond to Linux syscall frequencies used by CICMalDroid:
 * read, write, open, close, stat, fstat, lstat, poll, lseek, mmap, mprotect,
 * munmap, brk, ioctl, access, pipe, dup, dup2, nanosleep, getpid, socket,
 * connect, accept, sendto, recvfrom, sendmsg, recvmsg, shutdown, bind, listen,
 * getsockname, getpeername, socketpair, setsockopt, getsockopt, clone, fork,
 * execve, exit, wait4, kill, uname, fcntl, flock, fsync, fdatasync, truncate,
 * ftruncate, getdents, getcwd, chdir, fchdir, rename, mkdir, rmdir, creat,
 * link, unlink, symlink, readlink, chmod, fchmod, chown, fchown, lchown,
 * umask, gettimeofday, getrlimit, getrusage, sysinfo, times, ptrace, getuid,
 * syslog, getgid, setuid, setgid, geteuid, getegid, setpgid, getppid,
 * getpgrp, setsid, setreuid, setregid, getgroups, setgroups, setresuid,
 * setresgid, getresuid, getresgid, sigaltstack, mknod, statfs, fstatfs,
 * sysfs, getpriority, setpriority, sched_setparam, sched_getparam,
 * sched_setscheduler, sched_getscheduler, sched_get_priority_max,
 * sched_get_priority_min, sched_rr_get_interval, mlock, munlock, mlockall,
 * munlockall, prctl, arch_prctl, setrlimit, sync, acct, settimeofday,
 * mount, umount2, swapon, swapoff, reboot, sethostname, setdomainname,
 * ioperm, iopl, create_module, init_module, delete_module, get_kernel_syms,
 * quotactl, gettid, readahead, setxattr, getxattr, listxattr, removexattr,
 * tkill, futex, sched_setaffinity, sched_getaffinity, epoll_create,
 * epoll_ctl, epoll_wait, set_tid_address, restart_syscall, semtimedop,
 * timer_create, timer_settime, timer_gettime, timer_getoverrun, timer_delete,
 * clock_settime, clock_gettime, clock_getres, clock_nanosleep, exit_group,
 * tgkill, inotify_init, inotify_add_watch, inotify_rm_watch, openat
 */
class FeatureExtractor(private val context: Context) {

    companion object {
        private const val TAG = "FeatureExtractor"
        private const val NUM_FEATURES = 139

        // Syscall indices (mapping syscall names to positions in the 139-dim vector)
        // Based on CICMalDroid syscall frequency ordering
        private const val IDX_READ = 0
        private const val IDX_WRITE = 1
        private const val IDX_OPEN = 2
        private const val IDX_CLOSE = 3
        private const val IDX_STAT = 4
        private const val IDX_FSTAT = 5
        private const val IDX_LSTAT = 6
        private const val IDX_POLL = 7
        private const val IDX_LSEEK = 8
        private const val IDX_MMAP = 9
        private const val IDX_MPROTECT = 10
        private const val IDX_MUNMAP = 11
        private const val IDX_BRK = 12
        private const val IDX_IOCTL = 13
        private const val IDX_ACCESS = 14
        private const val IDX_PIPE = 15
        private const val IDX_DUP = 16
        private const val IDX_DUP2 = 17
        private const val IDX_NANOSLEEP = 18
        private const val IDX_GETPID = 19
        private const val IDX_SOCKET = 20
        private const val IDX_CONNECT = 21
        private const val IDX_ACCEPT = 22
        private const val IDX_SENDTO = 23
        private const val IDX_RECVFROM = 24
        private const val IDX_SENDMSG = 25
        private const val IDX_RECVMSG = 26
        private const val IDX_SHUTDOWN = 27
        private const val IDX_BIND = 28
        private const val IDX_LISTEN = 29
        private const val IDX_GETSOCKNAME = 30
        private const val IDX_GETPEERNAME = 31
        private const val IDX_SOCKETPAIR = 32
        private const val IDX_SETSOCKOPT = 33
        private const val IDX_GETSOCKOPT = 34
        private const val IDX_CLONE = 35
        private const val IDX_FORK = 36
        private const val IDX_EXECVE = 37
        private const val IDX_EXIT = 38
        private const val IDX_WAIT4 = 39
        private const val IDX_KILL = 40
        private const val IDX_UNAME = 41
        private const val IDX_FCNTL = 42
        private const val IDX_FLOCK = 43
        private const val IDX_FSYNC = 44
        private const val IDX_FDATASYNC = 45
        private const val IDX_TRUNCATE = 46
        private const val IDX_FTRUNCATE = 47
        private const val IDX_GETDENTS = 48
        private const val IDX_GETCWD = 49
        private const val IDX_CHDIR = 50
        private const val IDX_FCHDIR = 51
        private const val IDX_RENAME = 52
        private const val IDX_MKDIR = 53
        private const val IDX_RMDIR = 54
        private const val IDX_CREAT = 55
        private const val IDX_LINK = 56
        private const val IDX_UNLINK = 57
        private const val IDX_SYMLINK = 58
        private const val IDX_READLINK = 59
        private const val IDX_CHMOD = 60
        private const val IDX_FCHMOD = 61
        private const val IDX_CHOWN = 62
        private const val IDX_FCHOWN = 63
        private const val IDX_LCHOWN = 64
        private const val IDX_UMASK = 65
        private const val IDX_GETTIMEOFDAY = 66
        private const val IDX_GETRLIMIT = 67
        private const val IDX_GETRUSAGE = 68
        private const val IDX_SYSINFO = 69
        private const val IDX_TIMES = 70
        private const val IDX_PTRACE = 71
        private const val IDX_GETUID = 72
        private const val IDX_SYSLOG = 73
        private const val IDX_GETGID = 74
        private const val IDX_SETUID = 75
        private const val IDX_SETGID = 76
        private const val IDX_GETEUID = 77
        private const val IDX_GETEGID = 78
        private const val IDX_SETPGID = 79
        private const val IDX_GETPPID = 80
        private const val IDX_GETPGRP = 81
        private const val IDX_SETSID = 82
        private const val IDX_SETREUID = 83
        private const val IDX_SETREGID = 84
        private const val IDX_GETGROUPS = 85
        private const val IDX_SETGROUPS = 86
        private const val IDX_SETRESUID = 87
        private const val IDX_SETRESGID = 88
        private const val IDX_GETRESUID = 89
        private const val IDX_GETRESGID = 90
        private const val IDX_SIGALTSTACK = 91
        private const val IDX_MKNOD = 92
        private const val IDX_STATFS = 93
        private const val IDX_FSTATFS = 94
        private const val IDX_SYSFS = 95
        private const val IDX_GETPRIORITY = 96
        private const val IDX_SETPRIORITY = 97
        private const val IDX_SCHED_SETPARAM = 98
        private const val IDX_SCHED_GETPARAM = 99
        private const val IDX_SCHED_SETSCHEDULER = 100
        private const val IDX_SCHED_GETSCHEDULER = 101
        private const val IDX_SCHED_GET_PRIORITY_MAX = 102
        private const val IDX_SCHED_GET_PRIORITY_MIN = 103
        private const val IDX_SCHED_RR_GET_INTERVAL = 104
        private const val IDX_MLOCK = 105
        private const val IDX_MUNLOCK = 106
        private const val IDX_MLOCKALL = 107
        private const val IDX_MUNLOCKALL = 108
        private const val IDX_PRCTL = 109
        private const val IDX_ARCH_PRCTL = 110
        private const val IDX_SETRLIMIT = 111
        private const val IDX_SYNC = 112
        private const val IDX_ACCT = 113
        private const val IDX_SETTIMEOFDAY = 114
        private const val IDX_MOUNT = 115
        private const val IDX_UMOUNT2 = 116
        private const val IDX_SWAPON = 117
        private const val IDX_SWAPOFF = 118
        private const val IDX_REBOOT = 119
        private const val IDX_SETHOSTNAME = 120
        private const val IDX_SETDOMAINNAME = 121
        private const val IDX_IOPERM = 122
        private const val IDX_IOPL = 123
        private const val IDX_CREATE_MODULE = 124
        private const val IDX_INIT_MODULE = 125
        private const val IDX_DELETE_MODULE = 126
        private const val IDX_GET_KERNEL_SYMS = 127
        private const val IDX_QUOTACTL = 128
        private const val IDX_GETTID = 129
        private const val IDX_READAHEAD = 130
        private const val IDX_SETXATTR = 131
        private const val IDX_GETXATTR = 132
        private const val IDX_LISTXATTR = 133
        private const val IDX_REMOVEXATTR = 134
        private const val IDX_TKILL = 135
        private const val IDX_FUTEX = 136
        private const val IDX_SCHED_SETAFFINITY = 137
        private const val IDX_SCHED_GETAFFINITY = 138
    }

    /**
     * Extract the 139-dimensional feature vector for a given package.
     * Maps static analysis signals (permissions, components, metadata)
     * to estimated system call frequency patterns.
     */
    fun extractFeatures(packageName: String): FloatArray {
        val features = FloatArray(NUM_FEATURES)
        val pm: PackageManager = context.packageManager

        try {
            val appInfo = pm.getApplicationInfo(packageName, PackageManager.GET_META_DATA)
            val packageInfo = pm.getPackageInfo(
                packageName,
                PackageManager.GET_PERMISSIONS or
                PackageManager.GET_SERVICES or
                PackageManager.GET_RECEIVERS or
                PackageManager.GET_PROVIDERS or
                PackageManager.GET_ACTIVITIES
            )

            val permissions = packageInfo.requestedPermissions?.toSet() ?: emptySet()
            val isSystemApp = (appInfo.flags and ApplicationInfo.FLAG_SYSTEM) != 0
            val isDebuggable = (appInfo.flags and ApplicationInfo.FLAG_DEBUGGABLE) != 0

            // Component counts
            val serviceCount = packageInfo.services?.size ?: 0
            val receiverCount = packageInfo.receivers?.size ?: 0
            val providerCount = packageInfo.providers?.size ?: 0
            val activityCount = packageInfo.activities?.size ?: 0

            // App size (normalized to MB)
            val appSizeMB = try {
                File(appInfo.sourceDir).length().toFloat() / (1024f * 1024f)
            } catch (e: Exception) { 10f }

            // Installation source
            val installerPackage = try {
                if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.R) {
                    pm.getInstallSourceInfo(packageName).installingPackageName
                } else {
                    @Suppress("DEPRECATION")
                    pm.getInstallerPackageName(packageName)
                }
            } catch (e: Exception) { null }

            val isFromPlayStore = installerPackage == "com.android.vending"
            val isSideloaded = installerPackage == null || installerPackage.isEmpty()

            // ========================================
            // Map permissions to syscall frequencies
            // ========================================

            // -- File system access permissions --
            if (permissions.any { it.contains("READ_EXTERNAL_STORAGE") || it.contains("READ_MEDIA") }) {
                features[IDX_READ] += 15f
                features[IDX_OPEN] += 12f
                features[IDX_CLOSE] += 12f
                features[IDX_STAT] += 8f
                features[IDX_FSTAT] += 6f
                features[IDX_LSTAT] += 4f
                features[IDX_GETDENTS] += 5f
                features[IDX_ACCESS] += 5f
                features[IDX_LSEEK] += 4f
            }
            if (permissions.any { it.contains("WRITE_EXTERNAL_STORAGE") || it.contains("MANAGE_EXTERNAL_STORAGE") }) {
                features[IDX_WRITE] += 15f
                features[IDX_OPEN] += 10f
                features[IDX_CLOSE] += 10f
                features[IDX_CREAT] += 5f
                features[IDX_FSYNC] += 4f
                features[IDX_FDATASYNC] += 3f
                features[IDX_TRUNCATE] += 3f
                features[IDX_FTRUNCATE] += 2f
                features[IDX_RENAME] += 3f
                features[IDX_UNLINK] += 3f
                features[IDX_MKDIR] += 2f
                features[IDX_CHMOD] += 2f
            }

            // -- Network permissions → socket syscalls --
            if (permissions.contains("android.permission.INTERNET")) {
                features[IDX_SOCKET] += 20f
                features[IDX_CONNECT] += 15f
                features[IDX_SENDTO] += 12f
                features[IDX_RECVFROM] += 12f
                features[IDX_SENDMSG] += 8f
                features[IDX_RECVMSG] += 8f
                features[IDX_SETSOCKOPT] += 6f
                features[IDX_GETSOCKOPT] += 4f
                features[IDX_BIND] += 4f
                features[IDX_GETSOCKNAME] += 3f
                features[IDX_GETPEERNAME] += 3f
                features[IDX_POLL] += 10f
                features[IDX_READ] += 8f
                features[IDX_WRITE] += 8f
                features[IDX_CLOSE] += 5f
                features[IDX_FCNTL] += 4f
                features[IDX_SHUTDOWN] += 2f
            }
            if (permissions.contains("android.permission.ACCESS_NETWORK_STATE")) {
                features[IDX_SOCKET] += 3f
                features[IDX_IOCTL] += 5f
                features[IDX_READ] += 2f
            }
            if (permissions.any { it.contains("ACCESS_WIFI_STATE") || it.contains("CHANGE_WIFI_STATE") }) {
                features[IDX_IOCTL] += 4f
                features[IDX_SOCKET] += 2f
            }

            // -- Camera / Audio / Sensor permissions → ioctl + mmap --
            if (permissions.contains("android.permission.CAMERA")) {
                features[IDX_IOCTL] += 18f
                features[IDX_MMAP] += 12f
                features[IDX_OPEN] += 6f
                features[IDX_CLOSE] += 4f
                features[IDX_READ] += 5f
                features[IDX_WRITE] += 3f
                features[IDX_MUNMAP] += 4f
                features[IDX_MPROTECT] += 3f
                features[IDX_POLL] += 5f
            }
            if (permissions.contains("android.permission.RECORD_AUDIO")) {
                features[IDX_IOCTL] += 15f
                features[IDX_READ] += 10f
                features[IDX_MMAP] += 8f
                features[IDX_OPEN] += 4f
                features[IDX_CLOSE] += 4f
                features[IDX_WRITE] += 5f
                features[IDX_POLL] += 6f
            }

            // -- Location permissions --
            if (permissions.any { it.contains("ACCESS_FINE_LOCATION") || it.contains("ACCESS_COARSE_LOCATION") }) {
                features[IDX_IOCTL] += 8f
                features[IDX_SOCKET] += 5f
                features[IDX_CONNECT] += 3f
                features[IDX_READ] += 4f
                features[IDX_RECVFROM] += 3f
                features[IDX_GETTIMEOFDAY] += 4f
                features[IDX_NANOSLEEP] += 3f
            }

            // -- SMS permissions → suspicious syscall patterns --
            if (permissions.any { it.contains("READ_SMS") || it.contains("RECEIVE_SMS") }) {
                features[IDX_READ] += 8f
                features[IDX_OPEN] += 5f
                features[IDX_IOCTL] += 6f
                features[IDX_CLOSE] += 4f
                features[IDX_STAT] += 3f
            }
            if (permissions.any { it.contains("SEND_SMS") }) {
                features[IDX_WRITE] += 10f
                features[IDX_IOCTL] += 8f
                features[IDX_SENDTO] += 5f
                features[IDX_SOCKET] += 4f
                features[IDX_CONNECT] += 3f
            }

            // -- Contacts / Call log --
            if (permissions.any { it.contains("READ_CONTACTS") }) {
                features[IDX_READ] += 6f
                features[IDX_OPEN] += 4f
                features[IDX_CLOSE] += 4f
                features[IDX_STAT] += 3f
                features[IDX_IOCTL] += 4f
            }
            if (permissions.any { it.contains("WRITE_CONTACTS") }) {
                features[IDX_WRITE] += 5f
                features[IDX_OPEN] += 3f
                features[IDX_IOCTL] += 3f
            }
            if (permissions.any { it.contains("READ_CALL_LOG") || it.contains("PROCESS_OUTGOING_CALLS") }) {
                features[IDX_READ] += 5f
                features[IDX_OPEN] += 3f
                features[IDX_IOCTL] += 4f
            }

            // -- Phone state --
            if (permissions.contains("android.permission.READ_PHONE_STATE")) {
                features[IDX_IOCTL] += 6f
                features[IDX_READ] += 3f
                features[IDX_OPEN] += 2f
                features[IDX_GETUID] += 3f
            }

            // -- Dangerous system permissions --
            if (permissions.contains("android.permission.BIND_ACCESSIBILITY_SERVICE")) {
                features[IDX_PTRACE] += 10f
                features[IDX_IOCTL] += 12f
                features[IDX_READ] += 8f
                features[IDX_WRITE] += 6f
                features[IDX_MMAP] += 5f
                features[IDX_PRCTL] += 5f
                features[IDX_CLONE] += 4f
                features[IDX_FUTEX] += 5f
            }
            if (permissions.contains("android.permission.SYSTEM_ALERT_WINDOW")) {
                features[IDX_IOCTL] += 8f
                features[IDX_MMAP] += 6f
                features[IDX_MPROTECT] += 4f
                features[IDX_WRITE] += 4f
                features[IDX_CLONE] += 3f
            }
            if (permissions.contains("android.permission.BIND_DEVICE_ADMIN")) {
                features[IDX_PRCTL] += 8f
                features[IDX_SETUID] += 5f
                features[IDX_SETGID] += 5f
                features[IDX_IOCTL] += 6f
                features[IDX_MOUNT] += 3f
                features[IDX_KILL] += 3f
            }
            if (permissions.contains("android.permission.REQUEST_INSTALL_PACKAGES")) {
                features[IDX_EXECVE] += 5f
                features[IDX_CLONE] += 4f
                features[IDX_FORK] += 3f
                features[IDX_WRITE] += 6f
                features[IDX_OPEN] += 4f
                features[IDX_CHMOD] += 3f
            }

            // -- Boot receiver --
            if (permissions.contains("android.permission.RECEIVE_BOOT_COMPLETED")) {
                features[IDX_CLONE] += 5f
                features[IDX_PRCTL] += 4f
                features[IDX_NANOSLEEP] += 3f
                features[IDX_FUTEX] += 4f
                features[IDX_SETSID] += 2f
                features[IDX_GETPID] += 3f
            }

            // -- Bluetooth --
            if (permissions.any { it.contains("BLUETOOTH") }) {
                features[IDX_SOCKET] += 4f
                features[IDX_IOCTL] += 5f
                features[IDX_BIND] += 3f
                features[IDX_CONNECT] += 2f
            }

            // ========================================
            // Map component counts to syscall frequencies
            // ========================================

            // Services → background execution patterns
            if (serviceCount > 0) {
                val svcFactor = minOf(serviceCount.toFloat(), 10f)
                features[IDX_CLONE] += svcFactor * 2f
                features[IDX_FUTEX] += svcFactor * 2f
                features[IDX_PRCTL] += svcFactor * 1.5f
                features[IDX_NANOSLEEP] += svcFactor * 1.5f
                features[IDX_GETPID] += svcFactor
                features[IDX_GETTID] += svcFactor
                features[IDX_PIPE] += svcFactor * 0.5f
                features[IDX_POLL] += svcFactor
            }

            // Receivers → event handling
            if (receiverCount > 0) {
                val rcvFactor = minOf(receiverCount.toFloat(), 8f)
                features[IDX_POLL] += rcvFactor * 1.5f
                features[IDX_RECVMSG] += rcvFactor
                features[IDX_IOCTL] += rcvFactor
                features[IDX_FUTEX] += rcvFactor
            }

            // Content providers → database/file I/O
            if (providerCount > 0) {
                val provFactor = minOf(providerCount.toFloat(), 5f)
                features[IDX_OPEN] += provFactor * 3f
                features[IDX_READ] += provFactor * 3f
                features[IDX_WRITE] += provFactor * 2f
                features[IDX_CLOSE] += provFactor * 2f
                features[IDX_FSTAT] += provFactor * 2f
                features[IDX_FCNTL] += provFactor * 1.5f
                features[IDX_FLOCK] += provFactor
            }

            // Activities → UI-related syscalls
            if (activityCount > 0) {
                val actFactor = minOf(activityCount.toFloat(), 15f)
                features[IDX_MMAP] += actFactor * 1.5f
                features[IDX_MPROTECT] += actFactor
                features[IDX_BRK] += actFactor * 0.5f
                features[IDX_IOCTL] += actFactor * 0.5f
            }

            // ========================================
            // App metadata adjustments
            // ========================================

            // App size → memory mapping patterns
            features[IDX_MMAP] += appSizeMB * 2f
            features[IDX_MPROTECT] += appSizeMB * 1.5f
            features[IDX_MUNMAP] += appSizeMB * 0.5f
            features[IDX_BRK] += appSizeMB * 0.3f

            // Debuggable apps have debug-related syscalls
            if (isDebuggable) {
                features[IDX_PTRACE] += 15f
                features[IDX_PRCTL] += 8f
                features[IDX_KILL] += 3f
                features[IDX_WAIT4] += 4f
                features[IDX_CLONE] += 3f
            }

            // Sideloaded apps tend to have more suspicious patterns
            if (isSideloaded && !isSystemApp) {
                features[IDX_EXECVE] += 3f
                features[IDX_FORK] += 2f
                features[IDX_CHMOD] += 2f
                features[IDX_CHOWN] += 2f
                features[IDX_PRCTL] += 3f
                features[IDX_SETUID] += 2f
            }

            // Old target SDK → legacy behaviors
            val targetSdk = appInfo.targetSdkVersion
            if (targetSdk < 29) {
                features[IDX_OPEN] += 3f
                features[IDX_READ] += 3f
                features[IDX_WRITE] += 3f
                features[IDX_STAT] += 2f
                features[IDX_ACCESS] += 2f
            }

            // System apps have a distinctive pattern
            if (isSystemApp) {
                features[IDX_GETUID] += 5f
                features[IDX_GETEUID] += 3f
                features[IDX_GETGID] += 3f
                features[IDX_GETEGID] += 2f
                features[IDX_PRCTL] += 3f
                features[IDX_GETTIMEOFDAY] += 3f
                features[IDX_UNAME] += 2f
                features[IDX_SYSINFO] += 2f
            }

            // ========================================
            // Base syscall frequencies (all apps do these)
            // ========================================
            features[IDX_READ] += 5f
            features[IDX_WRITE] += 3f
            features[IDX_OPEN] += 4f
            features[IDX_CLOSE] += 4f
            features[IDX_MMAP] += 5f
            features[IDX_MPROTECT] += 3f
            features[IDX_BRK] += 2f
            features[IDX_IOCTL] += 3f
            features[IDX_FSTAT] += 3f
            features[IDX_FUTEX] += 4f
            features[IDX_CLONE] += 2f
            features[IDX_PRCTL] += 2f
            features[IDX_GETPID] += 2f
            features[IDX_GETTID] += 2f
            features[IDX_GETTIMEOFDAY] += 2f
            features[IDX_FCNTL] += 2f

            Log.d(TAG, "Extracted features for $packageName: " +
                    "perms=${permissions.size}, services=$serviceCount, " +
                    "receivers=$receiverCount, providers=$providerCount, " +
                    "activities=$activityCount, sizeMB=${"%.1f".format(appSizeMB)}")

        } catch (e: Exception) {
            Log.e(TAG, "Error extracting features for $packageName: ${e.message}", e)
            // Return zero vector on error (will likely predict Benign)
        }

        return features
    }
}
